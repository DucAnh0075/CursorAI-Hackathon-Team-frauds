"""
Chat models - Pydantic schemas for chat endpoints
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    images: Optional[List[str]] = None
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    message: str
    images: Optional[List[str]] = None  # Base64 encoded images
    history: Optional[List[Message]] = None
    model: Optional[str] = "openai"  # "openai" or "manus"
    reasoning_mode: Optional[bool] = False  # Enable step-by-step reasoning


class ChatResponse(BaseModel):
    message: str
    success: bool
    error: Optional[str] = None
