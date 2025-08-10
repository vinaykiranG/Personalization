import os
import uuid
import tempfile
from pathlib import Path

from google.cloud import storage
from google.oauth2 import service_account
from fastapi import UploadFile

BUCKET_NAME = "vigenair-logo-space"


def get_storage():
    credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    creds = None
    if credentials_path and os.path.exists(credentials_path):
        creds = service_account.Credentials.from_service_account_file(credentials_path)
    elif os.path.exists("/app/backend/service-account.json"):
        creds = service_account.Credentials.from_service_account_file("/app/backend/service-account.json")
    return storage.Client(project="demos-dev-467317", credentials=creds)


def upload_logo_file(client: storage.Client, file: UploadFile, user_id: str) -> str:
    ext = Path(file.filename).suffix.lower() or ".png"
    blob_path = f"logos/{user_id}/{uuid.uuid4()}{ext}"
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(blob_path)

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        content = file.file.read()
        tmp.write(content)
        temp_path = tmp.name

    blob.upload_from_filename(temp_path, content_type=file.content_type)
    try:
        blob.make_public()
    except Exception:
        # If uniform bucket-level access is enabled, use public URL format
        pass
    return blob.public_url