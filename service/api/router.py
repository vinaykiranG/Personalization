from fastapi import APIRouter
from service.api.endpoints import ui_settings

api_router = APIRouter()

api_router.include_router(
    ui_settings.ui_settings_router, prefix="/ui_settings", tags=["ui_settings"]
)