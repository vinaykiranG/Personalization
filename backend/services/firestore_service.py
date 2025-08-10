# backend/services/firestore_service.py

import os
from unittest.mock import MagicMock
import uuid

# --- Mocking GCP credentials ---
# This service is mocked because we don't have access to live GCP credentials.
# In a real environment, you would initialize a Firestore client here.

# --- Mock Database ---
# A simple in-memory dictionary to simulate Firestore.
_MOCK_DB = {
    "settings": {
        "OZ6p1jNlNkYwVeBaLPCa": {
            "__data__": {
                "brandName": "ViGenAir",
                "logoUrl": "https://storage.googleapis.com/vigenair-logo-space/eeccca0750dc564ea55c897f90f4fb99.png",
                "primaryColor": "#000000"
            },
            "saved_settings": {
                "mock-setting-id-1": {
                    "brandName": "Saved ViGenAir",
                    "logoUrl": "https://storage.googleapis.com/vigenair-logo-space/saved.png",
                    "primaryColor": "#ffffff"
                }
            }
        }
    }
}

def get_user_settings(user_id: str) -> dict | None:
    """Fetches user settings from Firestore."""
    return _MOCK_DB["settings"].get(user_id, {}).get("__data__")

def set_user_settings(user_id: str, settings: dict):
    """Saves user settings to Firestore."""
    if user_id not in _MOCK_DB["settings"]:
        _MOCK_DB["settings"][user_id] = {"__data__": {}, "saved_settings": {}}
    _MOCK_DB["settings"][user_id]["__data__"] = settings

def get_saved_settings(user_id: str) -> list[dict]:
    """Fetches all saved settings for a user."""
    saved_settings = _MOCK_DB["settings"].get(user_id, {}).get("saved_settings", {})
    return [{"id": k, **v} for k, v in saved_settings.items()]

def save_setting(user_id: str, settings: dict) -> str:
    """Saves a new setting to the saved_settings subcollection."""
    if user_id not in _MOCK_DB["settings"]:
        _MOCK_DB["settings"][user_id] = {"__data__": {}, "saved_settings": {}}

    new_id = f"mock-setting-id-{uuid.uuid4()}"
    _MOCK_DB["settings"][user_id]["saved_settings"][new_id] = settings
    return new_id

def delete_saved_setting(user_id: str, setting_id: str):
    """Deletes a saved setting."""
    if user_id in _MOCK_DB["settings"] and setting_id in _MOCK_DB["settings"][user_id]["saved_settings"]:
        del _MOCK_DB["settings"][user_id]["saved_settings"][setting_id]

def get_saved_setting_by_id(user_id: str, setting_id: str) -> dict | None:
    """Fetches a single saved setting by its ID."""
    return _MOCK_DB["settings"].get(user_id, {}).get("saved_settings", {}).get(setting_id)
