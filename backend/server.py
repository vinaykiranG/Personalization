import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Personalization Settings API", version="1.0.0")

# CORS - allow all for now; tighten in prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router (all routes are prefixed with /api inside router)
app.include_router(api_router)

@app.get("/")
async def root():
    return {"status": "ok", "service": "settings-api"}