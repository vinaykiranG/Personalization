from api.endpoints import (
    ui_settings,
    app_settings
)
from fastapi import APIRouter
api_router = APIRouter()

api_router.include_router(
    ui_settings.ui_settings_router, tags=["ui_settings_routes"]
)
api_router.include_router(
    app_settings.router, tags=["app_settings_routes"]
)