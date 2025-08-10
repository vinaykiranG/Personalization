import os
import uuid
from datetime import datetime, timezone
from functools import lru_cache
from typing import Dict, Any, Optional, List

try:
    from google.cloud import firestore
    from google.oauth2 import service_account
except Exception:
    firestore = None
    service_account = None

PROJECT_ID = "demos-dev-467317"

# Mock store when GCP credentials are not available
_MEM_DB: Dict[str, Dict[str, Dict[str, Any]]] = {}
_MOCK_MODE = False


def _to_iso(ts):
    try:
        if hasattr(ts, "to_datetime"):
            dt = ts.to_datetime()
        elif isinstance(ts, datetime):
            dt = ts
        else:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return None


def is_mock() -> bool:
    return _MOCK_MODE or firestore is None


@lru_cache(maxsize=1)
def get_firestore():
    global _MOCK_MODE
    if firestore is None:
        _MOCK_MODE = True
        return None
    credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    creds = None
    try:
        if credentials_path and os.path.exists(credentials_path):
            creds = service_account.Credentials.from_service_account_file(credentials_path)
        elif os.path.exists("/app/backend/service-account.json"):
            creds = service_account.Credentials.from_service_account_file("/app/backend/service-account.json")
        else:
            # If no creds present, force mock to avoid metadata server attempts
            _MOCK_MODE = True
            return None
        client = firestore.Client(project=PROJECT_ID, credentials=creds)
        return client
    except Exception:
        _MOCK_MODE = True
        return None


def _mock_user_store(user_id: str) -> Dict[str, Dict[str, Any]]:
    if user_id not in _MEM_DB:
        _MEM_DB[user_id] = {}
    return _MEM_DB[user_id]


def save_user_setting(user_id: str, data: dict) -> dict:
    db = get_firestore()
    setting_id = str(uuid.uuid4())

    if is_mock() or db is None:
        payload = {
            "brandName": data.get("brandName"),
            "logoUrl": data.get("logoUrl"),
            "primaryColor": data.get("primaryColor"),
            "createdAt": datetime.now(timezone.utc),
        }
        store = _mock_user_store(user_id)
        store[setting_id] = payload
        return {
            "id": setting_id,
            **payload,
            "createdAt": _to_iso(payload["createdAt"]),
        }

    payload = {
        "brandName": data.get("brandName"),
        "logoUrl": data.get("logoUrl"),
        "primaryColor": data.get("primaryColor"),
        "createdAt": firestore.SERVER_TIMESTAMP,
    }
    doc_ref = (
        db.collection("users").document(user_id).collection("settings").document(setting_id)
    )
    doc_ref.set(payload)
    snap = doc_ref.get()
    doc = snap.to_dict() if snap.exists else payload
    created_at = _to_iso(doc.get("createdAt"))
    return {
        "id": setting_id,
        "brandName": doc.get("brandName"),
        "logoUrl": doc.get("logoUrl"),
        "primaryColor": doc.get("primaryColor"),
        "createdAt": created_at,
    }


def get_latest_user_setting(user_id: str):
    db = get_firestore()
    if is_mock() or db is None:
        store = _mock_user_store(user_id)
        if not store:
            return None
        latest_id = sorted(store.keys(), key=lambda k: store[k]["createdAt"], reverse=True)[0]
        d = store[latest_id]
        return {
            "id": latest_id,
            "brandName": d.get("brandName"),
            "logoUrl": d.get("logoUrl"),
            "primaryColor": d.get("primaryColor"),
            "createdAt": _to_iso(d.get("createdAt")),
        }

    coll = db.collection("users").document(user_id).collection("settings")
    q = coll.order_by("createdAt", direction=firestore.Query.DESCENDING).limit(1)
    docs = list(q.stream())
    if not docs:
        return None
    d = docs[0]
    data = d.to_dict()
    return {
        "id": d.id,
        "brandName": data.get("brandName"),
        "logoUrl": data.get("logoUrl"),
        "primaryColor": data.get("primaryColor"),
        "createdAt": _to_iso(data.get("createdAt")),
    }


def list_user_settings(user_id: str):
    db = get_firestore()
    if is_mock() or db is None:
        store = _mock_user_store(user_id)
        out: List[Dict[str, Any]] = []
        for sid, d in sorted(store.items(), key=lambda it: it[1]["createdAt"], reverse=True):
            out.append({
                "id": sid,
                "brandName": d.get("brandName"),
                "logoUrl": d.get("logoUrl"),
                "primaryColor": d.get("primaryColor"),
                "createdAt": _to_iso(d.get("createdAt")),
            })
        return out

    coll = db.collection("users").document(user_id).collection("settings")
    q = coll.order_by("createdAt", direction=firestore.Query.DESCENDING)
    out = []
    for d in q.stream():
        data = d.to_dict()
        out.append(
            {
                "id": d.id,
                "brandName": data.get("brandName"),
                "logoUrl": data.get("logoUrl"),
                "primaryColor": data.get("primaryColor"),
                "createdAt": _to_iso(data.get("createdAt")),
            }
        )
    return out


def delete_user_setting(user_id: str, setting_id: str):
    db = get_firestore()
    if is_mock() or db is None:
        store = _mock_user_store(user_id)
        if setting_id in store:
            del store[setting_id]
        return
    doc_ref = db.collection("users").document(user_id).collection("settings").document(setting_id)
    doc_ref.delete()