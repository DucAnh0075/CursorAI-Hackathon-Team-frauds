"""
Flashcard Router - Generate and manage study flashcards
"""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.flashcard_service import flashcard_service

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


class FlashcardGenerateRequest(BaseModel):
    topic: str
    context: Optional[str] = None
    image: Optional[str] = None
    num_cards: int = 5


@router.post("/generate")
async def generate_flashcards(request: FlashcardGenerateRequest):
    """
    Generate study flashcards from a topic or problem.
    """
    try:
        result = await flashcard_service.generate_flashcards(
            topic=request.topic,
            context=request.context,
            image=request.image,
            num_cards=request.num_cards
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
