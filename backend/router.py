from fastapi import APIRouter
from .app_settings import router as settings_router

api_router = APIRouter(prefix="/api")

# Healthcheck
@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Mount settings endpoints
api_router.include_router(settings_router, prefix="/settings", tags=["settings"])