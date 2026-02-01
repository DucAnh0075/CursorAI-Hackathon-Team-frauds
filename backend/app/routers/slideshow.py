"""
Slideshow Router - Generate educational slideshows
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.slideshow_service import slideshow_service

router = APIRouter(prefix="/slideshow", tags=["slideshow"])


class SlideshowGenerateRequest(BaseModel):
    problem: str
    image: Optional[str] = None
    reasoning_analysis: Optional[Dict[str, Any]] = None


class RenderRequest(BaseModel):
    composition: Dict[str, Any]
    output_format: str = "mp4"


@router.post("/generate")
async def generate_slideshow(request: SlideshowGenerateRequest):
    """
    Generate an educational slideshow from a problem.
    Returns slide data with audio narrations.
    """
    try:
        result = await slideshow_service.generate_slideshow(
            problem=request.problem,
            reasoning_analysis=request.reasoning_analysis,
            image=request.image
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/render")
async def render_slideshow(request: RenderRequest):
    """
    Render a slideshow composition to video.
    """
    try:
        result = await slideshow_service.render_video(
            composition=request.composition,
            output_format=request.output_format
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
