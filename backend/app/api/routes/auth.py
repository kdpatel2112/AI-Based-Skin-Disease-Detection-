"""
Authentication routes: register, login, refresh, forgot/reset password,
profile retrieval. Email verification uses a signed token logged to mock_emails.txt.
"""
from datetime import datetime
import os
from pathlib import Path
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    decode_token,
)
from app.db.mongodb import users_collection
from app.models.user import UserModel
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserOut,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def log_mock_email(email_type: str, recipient: str, content: str):
    """Helper to log mock email alerts to a local workspace file for easy testing."""
    # Write to the backend workspace root directory
    workspace_dir = Path(__file__).resolve().parent.parent.parent.parent
    mock_email_file = workspace_dir / "mock_emails.txt"
    try:
        with open(mock_email_file, "a", encoding="utf-8") as f:
            f.write(f"=== MOCK EMAIL SENT AT {datetime.now().isoformat()} ===\n")
            f.write(f"Type: {email_type}\n")
            f.write(f"To: {recipient}\n")
            f.write(f"Content: {content}\n")
            f.write("=" * 60 + "\n\n")
    except Exception as e:
        print(f"Error logging mock email: {e}")


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    email_lower = payload.email.lower().strip()
    existing = await users_collection.find_one({"email": email_lower})
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")

    # Bootstrapping rule: First registered user becomes Admin automatically
    total_users = await users_collection.count_documents({})
    assigned_role = "admin" if total_users == 0 else "user"

    user = UserModel(
        full_name=payload.full_name,
        email=email_lower,
        hashed_password=hash_password(payload.password),
        role=assigned_role,
        preferred_language=payload.preferred_language,
    )
    result = await users_collection.insert_one(user.to_dict())
    user_id = str(result.inserted_id)

    # Generate and log mock email verification link
    verify_token = create_access_token(user_id)
    verify_link = f"{settings.frontend_origin}/verify-email?token={verify_token}"
    log_mock_email(
        "Email Verification",
        user.email,
        f"Hi {user.full_name},\n\nThank you for registering at AI Skin Health. Please click the link below to verify your email:\n{verify_link}"
    )

    return UserOut(
        id=user_id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        preferred_language=user.preferred_language,
        is_verified=user.is_verified,
    )


@router.post("/verify-email")
async def verify_email(token: str):
    decoded = decode_token(token)
    if not decoded:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired verification token.")
    
    result = await users_collection.update_one(
        {"_id": ObjectId(decoded["sub"])},
        {"$set": {"is_verified": True}},
    )
    if result.matched_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
        
    return {"message": "Email has been verified successfully."}


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    email_lower = payload.email.lower().strip()
    user = await users_collection.find_one({"email": email_lower})
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")

    user_id = str(user["_id"])
    return TokenResponse(
        access_token=create_access_token(user_id, role=user.get("role", "user")),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(refresh_token: str):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token.")

    user = await users_collection.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found.")

    user_id = str(user["_id"])
    return TokenResponse(
        access_token=create_access_token(user_id, role=user.get("role", "user")),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    email_lower = payload.email.lower().strip()
    user = await users_collection.find_one({"email": email_lower})
    if user:
        reset_token = create_access_token(str(user["_id"]))
        reset_link = f"{settings.frontend_origin}/reset-password?token={reset_token}"
        log_mock_email(
            "Password Reset Request",
            user["email"],
            f"Hi {user['full_name']},\n\nWe received a request to reset your password. Please click the link below to set a new password:\n{reset_link}"
        )
    # Always return a generic success message to prevent user enumeration attacks
    return {"message": "If that email is registered, a password reset link has been sent."}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    decoded = decode_token(payload.token)
    if not decoded:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset token.")
    await users_collection.update_one(
        {"_id": ObjectId(decoded["sub"])},
        {"$set": {"hashed_password": hash_password(payload.new_password)}},
    )
    return {"message": "Password has been reset successfully."}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=str(current_user["_id"]),
        full_name=current_user["full_name"],
        email=current_user["email"],
        role=current_user.get("role", "user"),
        preferred_language=current_user.get("preferred_language", "en"),
        is_verified=current_user.get("is_verified", False),
    )
