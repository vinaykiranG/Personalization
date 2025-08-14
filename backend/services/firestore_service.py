
import os
from google.cloud import firestore
from dotenv import load_dotenv

load_dotenv()


# Ensure Firestore emulator is always used if FIRESTORE_EMULATOR_HOST is set
FIRESTORE_EMULATOR_HOST = os.getenv('FIRESTORE_EMULATOR_HOST')
if FIRESTORE_EMULATOR_HOST:
    os.environ['FIRESTORE_EMULATOR_HOST'] = FIRESTORE_EMULATOR_HOST
    print(f"[Firestore] Using emulator at {FIRESTORE_EMULATOR_HOST}")

PROJECT_ID = os.getenv('PROJECT_ID')
COLLECTION_NAME = os.getenv('COLLECTION_NAME', 'Settings')

def get_firestore_client():
    return firestore.Client(project=PROJECT_ID)

def get_user_settings(brand_name: str) -> dict | None:
    db = get_firestore_client()
    doc_ref = db.collection(COLLECTION_NAME).document(brand_name)
    doc = doc_ref.get()
    return doc.to_dict() if doc.exists else None

def set_user_settings(user_id: str, settings: dict):
    db = get_firestore_client()
    # Use user_id as the document name for consistency
    doc_ref = db.collection(COLLECTION_NAME).document(user_id)
    doc_ref.set(settings, merge=True)

def get_saved_settings(user_id: str) -> list[dict]:
    db = get_firestore_client()
    settings_ref = db.collection(COLLECTION_NAME)
    docs = settings_ref.stream()
    return [{'id': doc.id, **doc.to_dict()} for doc in docs]

def save_setting(user_id: str, settings: dict, setting_id: str = None) -> str:
    db = get_firestore_client()
    settings_ref = db.collection(COLLECTION_NAME).document(user_id).collection('saved_settings')
    if setting_id:
        doc_ref = settings_ref.document(setting_id)
        doc_ref.set(settings, merge=True)
        return setting_id
    else:
        doc_ref = settings_ref.document()
        doc_ref.set(settings)
        return doc_ref.id

def delete_saved_setting(user_id: str, setting_id: str):
    db = get_firestore_client()
    doc_ref = db.collection(COLLECTION_NAME)
    doc_ref.delete()

def get_saved_setting_by_id(user_id: str, setting_id: str) -> dict | None:
    db = get_firestore_client()
    doc_ref = db.collection(COLLECTION_NAME)
    doc = doc_ref.get()
    return doc.to_dict() if doc.exists else None

def get_saved_setting_by_id(user_id: str, setting_id: str) -> dict | None:
    db = get_firestore_client()
    doc_ref = db.collection(COLLECTION_NAME)
    doc = doc_ref.get()
    return doc.to_dict() if doc.exists else None
