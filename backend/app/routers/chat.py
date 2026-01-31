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
    Send a message to the AI assistant
    Supports text and image attachments
    Model can be specified: "openai" or "manus"
    reasoning_mode: enables step-by-step explanations with visualizations
    """
    try:
        model = request.model or "openai"
        reasoning_mode = request.reasoning_mode or False
        
        print(f"[API Call] Received message with model: {model}, reasoning: {reasoning_mode}")
        print(f"[API Call] Message: '{request.message[:50]}{'...' if len(request.message) > 50 else ''}'")
        
        images = request.images or []
        print(f"[API Call] Images: {len(images)}")
        if images:
            for i, img in enumerate(images):
                print(f"[API Call] Image {i}: {img[:60]}...")
        
        response = await ai_service.generate_response(
            message=request.message,
            images=images if images else None,
            conversation_history=request.history,
            model=model,
            reasoning_mode=reasoning_mode
        )
        
        print(f"[API Response] Generated response from {model}: {response[:100]}...")
        return ChatResponse(
            message=response,
            success=True
        )
    except Exception as e:
        print(f"[API Error] Error: {str(e)}")
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
