import os
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
from google.cloud import firestore
import google.auth
import google.auth.transport.requests
from service.storage import upload_gcs_file_from_stream
import uuid

logger = logging.getLogger(__name__)

FIRESTORE_DATABASE_ID = "vigenair-db"

def get_firestore_client():
    """Initializes and returns a Firestore client."""
    try:
        project_id = os.getenv("PROJECT_ID")
        client = firestore.Client(project=project_id, database=FIRESTORE_DATABASE_ID)
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Firestore client: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect to Firestore: {e}")

class Settings(BaseModel):
    brandName: str
    logoUrl: str
    primaryColor: str

class SavedSetting(Settings):
    id: str

class UpdateSettingsResponse(BaseModel):
    """Pydantic model for the response of the update_app_settings endpoint."""
    message: str
    logo_url: Optional[str] = None
    brand_name: str
    color: str
    user_id: str

ui_settings_router = APIRouter()

@ui_settings_router.get("/get_settings/{user_id}", response_model=Settings)
def get_settings(user_id: str, db: firestore.Client = Depends(get_firestore_client)):
    """
    Fetches the latest settings for a user from Firestore.
    """
    try:
        doc_ref = db.collection("settings").document(user_id)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        else:
            return Settings(brandName="Default Brand", logoUrl="", primaryColor="#000000")
    except Exception as e:
        logger.error(f"Failed to get settings for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get settings: {e}")

@ui_settings_router.get("/get_all_settings/{user_id}", response_model=list[SavedSetting])
def get_all_settings(user_id: str, db: firestore.Client = Depends(get_firestore_client)):
    """
    Fetches all saved settings for a user from Firestore.
    """
    try:
        settings_ref = db.collection(f"users/{user_id}/appSettings")
        docs = settings_ref.stream()
        settings_list = []
        for doc in docs:
            setting_data = doc.to_dict()
            setting_data['id'] = doc.id
            settings_list.append(setting_data)
        return settings_list
    except Exception as e:
        logger.error(f"Failed to get all settings for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get all settings: {e}")

@ui_settings_router.delete("/delete_setting/{user_id}/{setting_id}", status_code=204)
def delete_setting(user_id: str, setting_id: str, db: firestore.Client = Depends(get_firestore_client)):
    """
    Deletes a saved setting for a user from Firestore.
    """
    try:
        doc_ref = db.collection(f"users/{user_id}/appSettings").document(setting_id)
        doc_ref.delete()
        return {"message": "Setting deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete setting {setting_id} for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete setting: {e}")

@ui_settings_router.post("/update_settings")
async def update_app_settings(
    brand_name: str = Form(...),
    color: str = Form(...),
    user_id: str = Form(...),
    logo_file: Optional[UploadFile] = File(None),
    db_client: firestore.Client = Depends(get_firestore_client)
):
    """
    Handles the update of application settings, including logo upload to GCS
    and data storage in Firestore.
    """
    logo_url = ""

    if logo_file:
        try:
            bucket_name = os.environ.get("GCS_BUCKET_NAME")
            if not bucket_name:
                raise HTTPException(status_code=500, detail="GCS_BUCKET_NAME environment variable not set")

            file_extension = os.path.splitext(logo_file.filename)[1]
            unique_filename_in_folder = f"user_logos/{user_id}/logo_{uuid.uuid4().hex}{file_extension}"

            logo_url = upload_gcs_file_from_stream(
                file_stream=logo_file.file,
                destination_file_name=unique_filename_in_folder,
                bucket_name=bucket_name
            )
        except Exception as e:
            logger.error(f"Failed to upload logo or generate signed URL: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to process logo: {e}")

    try:
        settings_doc_ref = db_client.collection(f"users/{user_id}/appSettings").document("branding_profile")
        
        settings_data = {
            "brandName": brand_name,
            "logoUrl": logo_url,
            "primaryColor": color,
            "last_updated": firestore.SERVER_TIMESTAMP
        }

        settings_doc_ref.set(settings_data, merge=True)
        logger.info(f"Settings saved to Firestore for user {user_id}")

    except Exception as e:
        logger.error(f"Failed to save settings to Firestore for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save settings to database: {e}")

    return {
        "message": "Settings updated successfully",
        "logo_url": logo_url,
        "brand_name": brand_name,
        "color": color,
        "user_id": user_id
    }
