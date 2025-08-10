from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from typing import List

from backend.services import firestore_service, storage_service
from backend.models.settings import (
    AppSettings,
    SavedAppSettings,
    UpdateSettingsPayload,
    SaveSettingsPayload,
    UploadLogoResponse,
)

router = APIRouter()

# Dependency to get user_id from headers
def get_user_id(request: Request):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user_id

@router.get("/settings/{user_id}", response_model=AppSettings)
def get_settings(user_id: str, current_user_id: str = Depends(get_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    settings = firestore_service.get_user_settings(user_id)
    if not settings:
        return AppSettings(brandName="", logoUrl="", primaryColor="#1976d2")
    return AppSettings(**settings)

@router.put("/settings/{user_id}", status_code=204)
def update_settings(user_id: str, payload: UpdateSettingsPayload, current_user_id: str = Depends(get_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    firestore_service.set_user_settings(user_id, payload.model_dump())

@router.get("/saved-settings/{user_id}", response_model=List[SavedAppSettings])
def get_saved_settings(user_id: str, current_user_id: str = Depends(get_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return firestore_service.get_saved_settings(user_id)

@router.post("/saved-settings/{user_id}", response_model=SavedAppSettings)
def save_settings(user_id: str, payload: SaveSettingsPayload, current_user_id: str = Depends(get_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    setting_id = firestore_service.save_setting(user_id, payload.model_dump())
    response_data = payload.model_dump()
    response_data['id'] = setting_id
    return SavedAppSettings(**response_data)

@router.delete("/saved-settings/{user_id}/{setting_id}", status_code=204)
def delete_saved_setting(user_id: str, setting_id: str, current_user_id: str = Depends(get_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    firestore_service.delete_saved_setting(user_id, setting_id)

@router.post("/upload-logo/{user_id}", response_model=UploadLogoResponse)
def upload_logo(user_id: str, file: UploadFile = File(...), current_user_id: str = Depends(get_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if file.content_type not in ["image/jpeg", "image/png", "image/gif"]:
        raise HTTPException(status_code=400, detail="Invalid file type")

    logo_url = storage_service.upload_logo(user_id, file)
    return UploadLogoResponse(logoUrl=logo_url)

@router.get("/saved-settings/{user_id}/{setting_id}", response_model=SavedAppSettings)
def get_saved_setting(user_id: str, setting_id: str, current_user_id: str = Depends(get_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    setting = firestore_service.get_saved_setting_by_id(user_id, setting_id)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    return SavedAppSettings(id=setting_id, **setting)
