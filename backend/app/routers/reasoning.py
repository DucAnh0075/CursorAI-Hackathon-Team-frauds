"""
Reasoning Router - Interactive step-by-step explanations
"""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.reasoning_service import reasoning_service

router = APIRouter(prefix="/reasoning", tags=["reasoning"])


class AnalyzeRequest(BaseModel):
    problem: str
    image: Optional[str] = None


class StepImageRequest(BaseModel):
    image_prompt: str


class SpeechRequest(BaseModel):
    text: str


@router.post("/analyze")
async def analyze_problem(request: AnalyzeRequest):
    """
    Analyze a problem and return structured steps.
    This creates the plan that can then be revealed step by step.
    """
    try:
        result = await reasoning_service.analyze_problem(
            problem=request.problem,
            image=request.image
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-image")
async def generate_step_image(request: StepImageRequest):
    """Generate an image for a step"""
    try:
        image_url = await reasoning_service.generate_step_image(request.image_prompt)
        return {"image_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/speak")
async def generate_speech(request: SpeechRequest):
    """Generate speech for a step explanation"""
    try:
        audio_data = await reasoning_service.generate_speech(request.text)
        return {"audio": audio_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
