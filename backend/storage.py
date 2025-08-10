import os
import uuid
import base64
import tempfile
from pathlib import Path

from google.cloud import storage
from google.oauth2 import service_account
from fastapi import UploadFile

BUCKET_NAME = "vigenair-logo-space"
_MOCK_MODE = False


def is_mock() -> bool:
    return _MOCK_MODE


def get_storage():
    global _MOCK_MODE
    credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    creds = None
    try:
        if credentials_path and os.path.exists(credentials_path):
            creds = service_account.Credentials.from_service_account_file(credentials_path)
        elif os.path.exists("/app/backend/service-account.json"):
            creds = service_account.Credentials.from_service_account_file("/app/backend/service-account.json")
        client = storage.Client(project="demos-dev-467317", credentials=creds)
        return client
    except Exception:
        _MOCK_MODE = True
        return None


def upload_logo_file(client: storage.Client, file: UploadFile, user_id: str) -> str:
    if is_mock() or client is None:
        # Return data URL so frontend can render immediately without GCS
        content = file.file.read()
        b64 = base64.b64encode(content).decode("ascii")
        ct = file.content_type or "image/png"
        return f"data:{ct};base64,{b64}"

    ext = Path(file.filename).suffix.lower() or ".png"
    blob_path = f"logos/{user_id}/{uuid.uuid4()}{ext}"
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(blob_path)

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        file.file.seek(0)
        content = file.file.read()
        tmp.write(content)
        temp_path = tmp.name

    blob.upload_from_filename(temp_path, content_type=file.content_type)
    try:
        blob.make_public()
    except Exception:
        pass
    return blob.public_url