from pydantic import BaseModel, Field
from pydantic.color import Color
from typing import Optional

class AppSettings(BaseModel):
    brandName: str = Field(..., max_length=50)
    logoUrl: Optional[str] = None
    primaryColor: Color
    description: Optional[str] = None

class SavedAppSettings(AppSettings):
    id: str

class UpdateSettingsPayload(BaseModel):
    brandName: str = Field(..., max_length=50)
    primaryColor: Color
    logoUrl: Optional[str] = None

class SaveSettingsPayload(BaseModel):
    brandName: str = Field(..., max_length=50)
    logoUrl: Optional[str] = None
    primaryColor: Color
    description: Optional[str] = None

class UploadLogoResponse(BaseModel):
    logoUrl: str
