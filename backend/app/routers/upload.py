"""
Upload router - handles file uploads
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import base64
import io

from app.core.config import settings
from app.models.upload import UploadResponse
from app.services.image_service import ImageService

router = APIRouter()
image_service = ImageService()


def extract_pdf_text(content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        from PyPDF2 import PdfReader
        pdf_file = io.BytesIO(content)
        reader = PdfReader(pdf_file)
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        return "\n\n".join(text_parts)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read PDF: {str(e)}")


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


@router.post("/pdf", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF file and extract its text content
    Returns the extracted text for AI processing
    """
    ext = file.filename.split(".")[-1].lower() if file.filename else ""
    if ext != "pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE // 1024 // 1024}MB"
        )
    
    # Extract text from PDF
    pdf_text = extract_pdf_text(content)
    
    if not pdf_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF. The PDF might be image-based.")
    
    return UploadResponse(
        success=True,
        filename=file.filename,
        data=pdf_text,
        mime_type="text/plain"
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
