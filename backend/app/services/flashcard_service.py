"""
Flashcard Service - Generate study flashcards from topics or problems
"""
from typing import Optional, Dict, Any, List
import httpx
import json

from app.core.config import settings


class FlashcardService:
    """Service for generating study flashcards"""
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
    
    async def generate_flashcards(
        self,
        topic: str,
        context: Optional[str] = None,
        image: Optional[str] = None,
        num_cards: int = 5
    ) -> Dict[str, Any]:
        """
        Generate study flashcards from a topic or problem.
        """
        system_prompt = f"""You are an expert educator creating study flashcards.
Generate {num_cards} flashcards based on the given topic or problem.

Return your response as JSON with this EXACT structure:
{{
    "topic_title": "Brief title for this flashcard set",
    "description": "One sentence describing what these flashcards cover",
    "cards": [
        {{
            "id": 1,
            "front": "Question or prompt (can include $...$ for math)",
            "back": "Answer or explanation (can include $...$ for math)",
            "hint": "Optional hint to help remember (one sentence)",
            "difficulty": "easy|medium|hard"
        }}
    ],
    "study_tips": "Brief tips for studying this material"
}}

GUIDELINES:
- Create clear, focused questions on the front
- Provide comprehensive but concise answers on the back
- Use $...$ for inline math (e.g., $x^2 + y^2 = r^2$)
- Vary difficulty: include easy, medium, and hard cards
- Cover key concepts, formulas, definitions, and applications
- Make hints helpful but not giving away the answer
- Cards should be self-contained and understandable"""

        messages = [{"role": "system", "content": system_prompt}]
        
        user_content = f"Create flashcards for: {topic}"
        if context:
            user_content += f"\n\nAdditional context:\n{context}"
        
        if image:
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": user_content},
                    {"type": "image_url", "image_url": {"url": image}}
                ]
            })
        else:
            messages.append({"role": "user", "content": user_content})
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": messages,
                    "max_tokens": 2500,
                    "response_format": {"type": "json_object"}
                },
                timeout=60.0
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
            else:
                raise Exception(f"OpenAI error: {response.text}")


flashcard_service = FlashcardService()
