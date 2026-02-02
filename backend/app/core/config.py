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
    GEMINI_API_KEY: str = ""
    HUME_API_KEY: str = ""
    
    # Manus AI Settings (OpenAI SDK compatible endpoint)
    MANUS_API_BASE_URL: str = "https://api.manus.im"
    MANUS_MODEL: str = "manus-1.6"
    
    # Gemini AI Settings
    GEMINI_API_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    GEMINI_MODEL: str = "gemini-1.5-pro"
    
    # MiniMax Video Settings
    MINIMAX_API_BASE_URL: str = "https://api.minimax.chat/v1"
    MINIMAX_VIDEO_MODEL: str = "video-01"
    MINIMAX_GROUP_ID: str = ""
    
    # CORS - allow Vercel deployments
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://ai-study-assistant.vercel.app"
    ]
    
    # Upload settings
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = ["png", "jpg", "jpeg", "gif", "webp", "pdf"]
    
    # Video output settings
    VIDEO_OUTPUT_DIR: str = "generated_videos"
    
    class Config:
        env_file = "../.env"
        extra = "ignore"


settings = Settings()
