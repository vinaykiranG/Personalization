# Copyright 2024 Google LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Request
from typing import List, Optional
from service.firestore import get_user_settings, set_user_settings, get_saved_settings, save_setting, delete_saved_setting, get_saved_setting_by_id
from service.storage import upload_gcs_file
from google.cloud import storage
import uuid

router = APIRouter()

@router.get("/settings/{userId}")
def get_settings(userId: str):
    settings = get_user_settings(userId)
    if not settings:
        # Return default settings and save to DB if not found
        settings = {
            "brandName": "",
            "logoUrl": "",
            "primaryColor": "#1976d2"
        }
        set_user_settings(userId, settings)
    return settings

@router.post("/settings/{userId}")
def post_settings(userId: str, payload: dict):
    set_user_settings(userId, payload)
    return {"success": True}

@router.get("/saved-settings/{userId}")
def get_saved_settings_api(userId: str):
    return get_saved_settings(userId)

@router.post("/saved-settings/{userId}")
def post_saved_settings(userId: str, payload: dict):
    setting_id = save_setting(userId, payload)
    return {"settingId": setting_id}

@router.delete("/saved-settings/{userId}/{settingId}")
def delete_saved_setting_api(userId: str, settingId: str):
    delete_saved_setting(userId, settingId)
    return {"success": True}

@router.post("/upload-logo/{userId}")
def upload_logo(userId: str, file: UploadFile = File(...)):
    filename = f"logos/{userId}/{uuid.uuid4()}_{file.filename}"
    url = upload_gcs_file(file.file, filename)
    return {"logoUrl": url}

@router.get("/saved-settings/{userId}/{settingId}")
def get_saved_setting_api(userId: str, settingId: str):
    setting = get_saved_setting_by_id(userId, settingId)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting
