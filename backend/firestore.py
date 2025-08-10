import os
import uuid
from datetime import datetime, timezone
from functools import lru_cache

from google.cloud import firestore
from google.oauth2 import service_account


PROJECT_ID = "demos-dev-467317"


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


@lru_cache(maxsize=1)
def get_firestore():
    credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    creds = None
    if credentials_path and os.path.exists(credentials_path):
        creds = service_account.Credentials.from_service_account_file(credentials_path)
    elif os.path.exists("/app/backend/service-account.json"):
        creds = service_account.Credentials.from_service_account_file("/app/backend/service-account.json")
    return firestore.Client(project=PROJECT_ID, credentials=creds)


def save_user_setting(user_id: str, data: dict) -> dict:
    db = get_firestore()
    setting_id = str(uuid.uuid4())
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
    doc_ref = db.collection("users").document(user_id).collection("settings").document(setting_id)
    doc_ref.delete()