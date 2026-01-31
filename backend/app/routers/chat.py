"""
Chat router - handles AI conversation endpoints
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional

from app.models.chat import ChatRequest, ChatResponse, Message
from app.services.ai_service import ai_service

router = APIRouter()


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Send a message to the AI assistant (Manus AI)
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
    Stream AI response for real-time feedback using Manus AI
    Returns a Server-Sent Events stream
    """
    async def generate():
        try:
            async for chunk in ai_service.stream_response(
                message=request.message,
                images=request.images,
                conversation_history=request.history
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
