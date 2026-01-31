"""
Explanation Router - API endpoints for step-by-step explanations
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.services.explanation_service import explanation_service

router = APIRouter(prefix="/explain", tags=["explanation"])


class ExplanationRequest(BaseModel):
    problem: str
    image: Optional[str] = None  # Base64 image of the problem
    notation_context: Optional[str] = None  # Notation used in the problem
    generate_images: bool = True  # Whether to generate step images


class StepResponse(BaseModel):
    step_number: int
    title: str
    explanation: str
    math_content: str
    visual_description: str
    key_insight: str
    generated_image: Optional[str] = None


class ExplanationResponse(BaseModel):
    problem_summary: str
    notation_used: List[str]
    steps: List[StepResponse]
    final_answer: str
    red_thread: str


@router.post("/solve", response_model=ExplanationResponse)
async def solve_with_explanation(request: ExplanationRequest):
    """
    Solve a problem with detailed step-by-step explanations.
    Each step includes an explanation, math content, and optionally a generated image.
    """
    try:
        print(f"[Explanation] Received problem: {request.problem[:100]}...")
        
        result = await explanation_service.generate_step_explanation(
            problem_description=request.problem,
            problem_image=request.image,
            notation_context=request.notation_context
        )
        
        # Ensure all required fields exist
        steps = []
        for step_data in result.get("steps", []):
            steps.append(StepResponse(
                step_number=step_data.get("step_number", 0),
                title=step_data.get("title", ""),
                explanation=step_data.get("explanation", ""),
                math_content=step_data.get("math_content", ""),
                visual_description=step_data.get("visual_description", ""),
                key_insight=step_data.get("key_insight", ""),
                generated_image=step_data.get("generated_image")
            ))
        
        return ExplanationResponse(
            problem_summary=result.get("problem_summary", ""),
            notation_used=result.get("notation_used", []),
            steps=steps,
            final_answer=result.get("final_answer", ""),
            red_thread=result.get("red_thread", "")
        )
        
    except Exception as e:
        print(f"[Explanation] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quick-solve")
async def quick_solve(request: ExplanationRequest):
    """
    Quick solve without image generation - faster response.
    """
    try:
        result = await explanation_service._get_structured_solution(
            problem=request.problem,
            image=request.image,
            notation=request.notation_context
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
