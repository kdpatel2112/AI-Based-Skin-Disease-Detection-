"""
Cloudinary upload helper for storing user-uploaded skin images and generated
Grad-CAM overlays. Requires CLOUDINARY_* env vars to be set; in their absence
this falls back to local disk storage under the static/uploads folder inside
the workspace, allowing the local dev frontend to render them successfully.
"""
import os
import uuid
from pathlib import Path

import cloudinary
import cloudinary.uploader

from app.core.config import settings

_configured = False


def _ensure_configured() -> bool:
    global _configured
    if not settings.cloudinary_cloud_name:
        return False
    if not _configured:
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )
        _configured = True
    return True


def upload_image_bytes(image_bytes: bytes, folder: str = "skin-ai/uploads") -> str:
    if _ensure_configured():
        result = cloudinary.uploader.upload(image_bytes, folder=folder, resource_type="image")
        return result["secure_url"]

    # Local fallback inside workspace static/uploads folder
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    local_dir = BASE_DIR / "static" / "uploads"
    os.makedirs(local_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.jpg"
    path = os.path.join(local_dir, filename)
    with open(path, "wb") as f:
        f.write(image_bytes)
    return f"{settings.backend_url}/static/uploads/{filename}"
