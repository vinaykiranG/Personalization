import os
import uuid
import tempfile
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, status
from pydantic import BaseModel, Field

from firestore import (
    get_firestore,
    save_user_setting,
    get_latest_user_setting,
    list_user_settings,
    delete_user_setting,
)
from storage import get_storage, upload_logo_file
from utils import validate_hex_color, validate_image_upload

router = APIRouter()

class Settings(BaseModel):
    brandName: str = Field(..., min_length=1, max_length=50)
    logoUrl: Optional[str] = None
    primaryColor: str

    @classmethod
    def validate_model(cls, data: dict):
        # basic validations beyond pydantic
        if not data.get("brandName"):
            raise HTTPException(status_code=400, detail="Brand name is required")
        color = data.get("primaryColor")
        if not validate_hex_color(color):
            raise HTTPException(status_code=400, detail="primaryColor must be a valid hex like #RRGGBB")

class SettingsWithId(Settings):
    id: str
    createdAt: Optional[str] = None

@router.get("/{user_id}", response_model=SettingsWithId)
async def api_get_latest(user_id: str):
    doc = get_latest_user_setting(user_id)
    if not doc:
        raise HTTPException(status_code=404, detail="No settings found")
    return doc

@router.get("/{user_id}/all", response_model=List[SettingsWithId])
async def api_get_all(user_id: str):
    return list_user_settings(user_id)

@router.put("/{user_id}", response_model=SettingsWithId)
async def api_put_settings(user_id: str, payload: Settings):
    Settings.validate_model(payload.model_dump())
    saved = save_user_setting(user_id, payload.model_dump())
    return saved

@router.delete("/{user_id}/{setting_id}")
async def api_delete_setting(user_id: str, setting_id: str):
    delete_user_setting(user_id, setting_id)
    return {"message": "Deleted"}

@router.post("/{user_id}/upload-logo")
async def api_upload_logo(user_id: str, file: UploadFile = File(...)):
    # Validate upload
    validate_image_upload(file)
    storage = get_storage()
    url = upload_logo_file(storage, file, user_id)
    return {"logoUrl": url}