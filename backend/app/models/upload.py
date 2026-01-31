"""
Upload models - Pydantic schemas for upload endpoints
"""
from pydantic import BaseModel
from typing import Optional


class UploadResponse(BaseModel):
    success: bool
    filename: Optional[str] = None
    data: Optional[str] = None  # Base64 encoded data
    mime_type: Optional[str] = None
    error: Optional[str] = None
