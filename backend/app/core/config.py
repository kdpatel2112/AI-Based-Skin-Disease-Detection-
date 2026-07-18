"""
Centralized application configuration loaded from environment variables.
Copy .env.example to .env at the project root and fill in real values.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Mongo
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "skin_ai"

    # Auth
    jwt_secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    # Cloudinary
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    # SMTP
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_name: str = "AI Skin Health"

    # ML
    model_path: str = "./ml/saved_model/skin_model.keras"
    use_mock_model: bool = True

    # CORS & URLs
    frontend_origin: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
