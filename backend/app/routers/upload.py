"""
Upload router - handles file uploads
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import base64

from app.core.config import settings
from app.models.upload import UploadResponse
from app.services.image_service import ImageService

router = APIRouter()
image_service = ImageService()


@router.post("/image", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """
    Upload a single image
    Returns base64 encoded image for chat context
    """
    # Validate file extension
    ext = file.filename.split(".")[-1].lower() if file.filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}"
        )
    
    # Read and encode file
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE // 1024 // 1024}MB"
        )
    
    base64_image = base64.b64encode(content).decode("utf-8")
    mime_type = file.content_type or f"image/{ext}"
    
    return UploadResponse(
        success=True,
        filename=file.filename,
        data=f"data:{mime_type};base64,{base64_image}",
        mime_type=mime_type
    )


@router.post("/images", response_model=List[UploadResponse])
async def upload_multiple_images(files: List[UploadFile] = File(...)):
    """
    Upload multiple images at once
    """
    results = []
    for file in files:
        try:
            result = await upload_image(file)
            results.append(result)
        except HTTPException as e:
            results.append(UploadResponse(
                success=False,
                filename=file.filename,
                error=e.detail
            ))
    return results
