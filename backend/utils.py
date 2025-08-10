import re
import os
import uuid
from fastapi import HTTPException, UploadFile, status

HEX_COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


def validate_hex_color(value: str) -> bool:
    if not isinstance(value, str):
        return False
    return HEX_COLOR_RE.match(value) is not None


def generate_id() -> str:
    return str(uuid.uuid4())


def validate_image_upload(file: UploadFile, max_bytes: int = 2 * 1024 * 1024):
    # Check content type first
    allowed = {"image/png", "image/jpeg"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                            detail="Only PNG and JPEG are allowed")

    # Attempt to read a small chunk to estimate size; then full content length if provided
    size = 0
    try:
        # Not reading the whole file into memory here; rely on file.spool_max_size if present
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
    except Exception:
        size = 0

    if size and size > max_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail="File size exceeds 2MB limit")