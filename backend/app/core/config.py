"""
Application configuration settings
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "AI Study Assistant"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # API Keys
    OPENAI_API_KEY: str = ""
    MINIMAX_API_KEY: str = ""
    MANUS_API_KEY: str = ""
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Upload settings
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = ["png", "jpg", "jpeg", "gif", "webp", "pdf"]
    
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
