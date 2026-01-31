"""
Chat router - handles AI conversation endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional

from app.models.chat import ChatRequest, ChatResponse, Message
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Send a message to the AI assistant
    Supports text and image attachments
    """
    try:
        response = await ai_service.generate_response(
            message=request.message,
            images=request.images,
            conversation_history=request.history
        )
        return ChatResponse(
            message=response,
            success=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def stream_message(request: ChatRequest):
    """
    Stream AI response for real-time feedback
    """
    # TODO: Implement streaming response
    pass
