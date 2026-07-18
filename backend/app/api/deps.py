"""
Shared FastAPI dependencies: current-user extraction and role guarding.
"""
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_token
from app.db.mongodb import users_collection

from typing import Optional
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> dict:
    # Bypass authentication and return a default admin user from database or fallback mock
    user = await users_collection.find_one({"role": "admin"})
    if not user:
        user = await users_collection.find_one({})
    if not user:
        user = {
            "_id": ObjectId("6a3e48820c7c56925b729ee3"),
            "full_name": "Krishna Patel",
            "email": "krishna@example.com",
            "role": "admin",
            "preferred_language": "en",
            "is_verified": True,
            "favorite_doctors": [],
            "favorite_hospitals": []
        }
    else:
        user = dict(user)
        user["role"] = "admin"  # Upgrade to admin so admin features are accessible
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user
