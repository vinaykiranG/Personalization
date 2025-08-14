from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, Form
from typing import List
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
    user_id = request.headers.get("X-User-Id")  # Fix: Use X-User-Id
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user_id

@router.get("/settings/{brand_name}", response_model=AppSettings)
def get_settings(brand_name: str, current_user_id: str = Depends(get_user_id)):
    settings = firestore_service.get_user_settings(brand_name)
    if not settings:
        return AppSettings(brandName="ViGenAir", logoUrl="https://services.google.com/fh/files/misc/vigenair_logo.png", primaryColor="#1976d2")
    return AppSettings(**settings)


# ADD this missing endpoint that your frontend is calling
@router.get("/ui_settings/get_settings/{user_id}", response_model=AppSettings)
async def get_user_settings(user_id: str, current_user_id: str = Depends(get_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    settings = firestore_service.get_user_settings(user_id)
    if not settings:
        return AppSettings(
            brandName="ViGenAir",
            logoUrl="https://services.google.com/fh/files/misc/vigenair_logo.png",
            primaryColor="#1976d2"
        )
    return AppSettings(**settings)

# POST /ui_settings/update_settings
from fastapi import Request

@router.post("/ui_settings/update_settings", response_model=AppSettings)
async def update_settings(
    brand_name: str = Form(...),
    color: str = Form(...),
    logo_file: UploadFile = File(None),
    current_user_id: str = Depends(get_user_id)
):
    try:
        logo_url = None
        if logo_file:
            try:
                logo_url = storage_service.upload_logo(brand_name, logo_file)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")
        settings_dict = {
            "brandName": brand_name,
            "primaryColor": color,
            "logoUrl": logo_url or "https://services.google.com/fh/files/misc/vigenair_logo.png"
        }
        try:
            firestore_service.set_user_settings(brand_name, settings_dict)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to store settings in Firestore: {str(e)}")
        return AppSettings(**settings_dict)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


# GET /ui_settings/get_all_settings/{user_id}
@router.get("/ui_settings/get_all_settings/{user_id}", response_model=List[SavedAppSettings])
async def get_all_settings(user_id: str, current_user_id: str = Depends(get_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return firestore_service.get_saved_settings(user_id)

# POST /ui_settings/save_setting/{user_id}
@router.post("/ui_settings/save_setting/{user_id}", response_model=SavedAppSettings)
async def save_setting(user_id: str, payload: SaveSettingsPayload, current_user_id: str = Depends(get_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    data = payload.model_dump()
    # Ensure description is present in the dict, even if None
    if 'description' not in data:
        data['description'] = None
    setting_id = firestore_service.save_setting(user_id, data)
    response_data = data.copy()
    response_data['id'] = setting_id
    return SavedAppSettings(**response_data)

# PUT /ui_settings/update_saved_setting/{user_id}/{setting_id}
@router.put("/ui_settings/update_saved_setting/{user_id}/{setting_id}", response_model=SavedAppSettings)
async def update_saved_setting(user_id: str, setting_id: str, payload: SaveSettingsPayload, current_user_id: str = Depends(get_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    # Overwrite the saved setting document
    firestore_service.save_setting(user_id, payload.model_dump(), setting_id=setting_id)
    response_data = payload.model_dump()
    response_data['id'] = setting_id
    return SavedAppSettings(**response_data)

# GET /ui_settings/get_saved_setting/{user_id}/{setting_id}
@router.get("/ui_settings/get_saved_setting/{user_id}/{setting_id}", response_model=SavedAppSettings)
async def get_saved_setting(user_id: str, setting_id: str, current_user_id: str = Depends(get_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    setting = firestore_service.get_saved_setting_by_id(user_id, setting_id)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return SavedAppSettings(id=setting_id, **setting)

# Test Firestore Connection
@router.get("/test-firestore-connection")
async def test_connection():
    try:
        # First, try to set some test data
        test_settings = {
            "brandName": "ViGenAir",
            "logoUrl": "https://storage.googleapis.com/vigenair-logo-space/default-logo.png",
            "primaryColor": "#1976d2"
        }
        firestore_service.set_user_settings("Settings", test_settings)
        
        # Then try to read it back
        settings = firestore_service.get_user_settings("Settings")
        return {
            "status": "success",
            "connected": True,
            "settings": settings,
            "message": "Successfully wrote and read from Firestore emulator"
        }
    except Exception as e:
        return {
            "status": "error",
            "connected": False,
            "error": str(e),
            "message": "Failed to connect to Firestore emulator"
        }

# DELETE /ui_settings/delete_setting/{user_id}/{setting_id}
@router.delete("/ui_settings/delete_setting/{user_id}/{setting_id}")
async def delete_setting(user_id: str, setting_id: str, current_user_id: str = Depends(get_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    firestore_service.delete_saved_setting(user_id, setting_id)  # Fix: Actually call the service
    return {"status": "deleted"}
# Debug endpoint for saved settings
@router.get("/debug/saved-settings/{user_id}")
async def debug_saved_settings(user_id: str):
    try:
        result = firestore_service.get_saved_settings(user_id)
        return {
            "user_id": user_id,
            "count": len(result),
            "data": result
        }
    except Exception as e:
        return {
            "error": str(e),
            "user_id": user_id
        }
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
