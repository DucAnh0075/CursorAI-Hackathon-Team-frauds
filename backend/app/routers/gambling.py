"""
Gambling Router - Educational gambling analysis endpoints
"""
from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.gambling_service import gambling_service

router = APIRouter(prefix="/gambling", tags=["gambling"])


class GamblingAnalysisRequest(BaseModel):
    scenario: str
    image: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = None


@router.post("/analyze")
async def analyze_gambling_scenario(request: GamblingAnalysisRequest):
    """
    Analyze a gambling scenario with Lucky Larry's enthusiastic but mathematically honest advice.
    Educational satire showing why gambling is problematic.
    """
    try:
        result = await gambling_service.analyze_gambling_scenario(
            scenario=request.scenario,
            image=request.image,
            conversation_history=request.conversation_history
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
