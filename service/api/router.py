from fastapi import APIRouter
from service.api.endpoints import ui_settings, app_settings

api_router = APIRouter()

api_router.include_router(
    ui_settings.ui_settings_router, tags=["ui_settings"]
)
api_router.include_router(
    app_settings.router, prefix="/api", tags=["app_settings"]
)