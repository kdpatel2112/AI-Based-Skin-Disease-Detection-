"""
Domain representation of a User document stored in MongoDB.
Stored as a plain dict via Motor; this class documents the shape.
"""
from datetime import datetime, timezone
from typing import Literal


class UserModel:
    def __init__(
        self,
        full_name: str,
        email: str,
        hashed_password: str,
        role: Literal["user", "admin"] = "user",
        preferred_language: str = "en",
        is_verified: bool = False,
    ):
        self.full_name = full_name
        self.email = email
        self.hashed_password = hashed_password
        self.role = role
        self.preferred_language = preferred_language
        self.is_verified = is_verified
        self.created_at = datetime.now(timezone.utc)

    def to_dict(self) -> dict:
        return {
            "full_name": self.full_name,
            "email": self.email,
            "hashed_password": self.hashed_password,
            "role": self.role,
            "preferred_language": self.preferred_language,
            "is_verified": self.is_verified,
            "created_at": self.created_at,
            "favorite_doctors": [],
            "favorite_hospitals": [],
        }
