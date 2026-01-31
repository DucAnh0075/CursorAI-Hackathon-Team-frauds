"""
Video router - handles video generation endpoints
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

from app.services.video_service import video_service

router = APIRouter()


class VideoGenerationRequest(BaseModel):
    """Request model for video generation"""
    topic: str
    problem_context: Optional[str] = None
    style: str = "educational"  # educational, explainer, tutorial


class VideoStatusRequest(BaseModel):
    """Request model for checking video status"""
    task_id: str


class VideoGenerationResponse(BaseModel):
    """Response model for video generation"""
    success: bool
    task_id: Optional[str] = None
    status: Optional[str] = None
    message: Optional[str] = None
    video_url: Optional[str] = None
    error: Optional[str] = None
    estimated_time: Optional[str] = None


@router.post("/generate", response_model=VideoGenerationResponse)
async def generate_video(request: VideoGenerationRequest):
    """
    Generate a learning video based on a topic or problem
    
    This endpoint starts an async video generation task and returns a task_id
    that can be used to check the status and retrieve the video when ready.
    """
    try:
        result = await video_service.generate_learning_video(
            topic=request.topic,
            problem_context=request.problem_context,
            style=request.style
        )
        return VideoGenerationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{task_id}", response_model=VideoGenerationResponse)
async def check_video_status(task_id: str):
    """
    Check the status of a video generation task
    
    Poll this endpoint to check if your video is ready.
    When status is "Success", the video_url will contain the download link.
    """
    try:
        result = await video_service.check_video_status(task_id)
        return VideoGenerationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-sync", response_model=VideoGenerationResponse)
async def generate_video_sync(request: VideoGenerationRequest):
    """
    Generate a video and wait for completion (blocking)
    
    This endpoint will wait up to 5 minutes for the video to be generated.
    Use this for simpler integrations where you want to wait for the result.
    
    Note: This can take several minutes. Consider using the async endpoint
    (/generate) with status polling for better UX.
    """
    try:
        result = await video_service.generate_video_with_polling(
            topic=request.topic,
            problem_context=request.problem_context,
            style=request.style,
            max_wait_seconds=300,
            poll_interval=10
        )
        return VideoGenerationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
