"""
Explanation Service - Generates step-by-step explanations with visual aids
"""
from typing import List, Optional, Dict, Any
import httpx
import json
import base64
import re

from app.core.config import settings


class ExplanationService:
    """Service for generating structured step-by-step explanations with images"""
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.manus_key = settings.MANUS_API_KEY
    
    async def generate_step_explanation(
        self,
        problem_description: str,
        problem_image: Optional[str] = None,
        notation_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a structured step-by-step explanation for a problem.
        Returns a "red thread" of solution steps with explanations.
        """
        # First, get the AI to analyze and structure the solution
        structured_solution = await self._get_structured_solution(
            problem_description, 
            problem_image,
            notation_context
        )
        
        # Generate images for key steps
        steps_with_images = await self._generate_step_images(
            structured_solution,
            notation_context
        )
        
        return steps_with_images
    
    async def _get_structured_solution(
        self,
        problem: str,
        image: Optional[str] = None,
        notation: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get AI to structure the solution into clear steps"""
        
        system_prompt = """Du bist ein Mathe-Tutor, der Probleme in klare, verständliche Schritte zerlegt.

WICHTIG: Strukturiere deine Antwort IMMER als JSON mit folgendem Format:
{
    "problem_summary": "Kurze Zusammenfassung des Problems",
    "notation_used": ["Liste der verwendeten Symbole/Notationen"],
    "steps": [
        {
            "step_number": 1,
            "title": "Kurzer Titel des Schritts",
            "explanation": "Ausführliche Erklärung was hier passiert und WARUM",
            "math_content": "Die mathematischen Berechnungen in LaTeX mit \\( \\) für inline und \\[ \\] für display",
            "visual_description": "Beschreibung für ein erklärendes Bild (auf Deutsch)",
            "key_insight": "Die wichtigste Erkenntnis dieses Schritts"
        }
    ],
    "final_answer": "Das Endergebnis",
    "red_thread": "Der rote Faden - wie hängen alle Schritte zusammen?"
}

Regeln:
1. Jeder Schritt muss für sich verständlich sein
2. Erkläre das WARUM, nicht nur das WAS
3. Die visual_description soll beschreiben, was auf einem Bild gezeigt werden soll
4. Nutze die gleiche Notation wie im ursprünglichen Problem
5. Der rote Faden verbindet alle Schritte logisch"""

        messages = [{"role": "system", "content": system_prompt}]
        
        # Build user message
        user_content = []
        
        prompt = f"Analysiere und löse dieses Problem Schritt für Schritt:\n\n{problem}"
        if notation:
            prompt += f"\n\nVerwendete Notation im Original: {notation}"
        
        user_content.append({"type": "text", "text": prompt})
        
        if image:
            user_content.append({
                "type": "image_url",
                "image_url": {"url": image}
            })
        
        messages.append({"role": "user", "content": user_content if image else prompt})
        
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
                    "max_tokens": 4096,
                    "response_format": {"type": "json_object"}
                },
                timeout=120.0
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    # Try to extract JSON from response
                    return self._parse_fallback_response(content)
            else:
                raise Exception(f"OpenAI API error: {response.text}")
    
    def _parse_fallback_response(self, content: str) -> Dict[str, Any]:
        """Fallback parser if JSON parsing fails"""
        return {
            "problem_summary": "Lösung",
            "notation_used": [],
            "steps": [{
                "step_number": 1,
                "title": "Lösung",
                "explanation": content,
                "math_content": "",
                "visual_description": "",
                "key_insight": ""
            }],
            "final_answer": "",
            "red_thread": ""
        }
    
    async def _generate_step_images(
        self,
        solution: Dict[str, Any],
        notation: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate explanatory images for each step using Manus AI"""
        
        steps = solution.get("steps", [])
        notation_used = solution.get("notation_used", [])
        
        for step in steps:
            visual_desc = step.get("visual_description", "")
            math_content = step.get("math_content", "")
            
            if visual_desc:
                try:
                    image_url = await self._generate_math_image(
                        visual_desc,
                        math_content,
                        notation_used
                    )
                    step["generated_image"] = image_url
                except Exception as e:
                    print(f"[Explanation] Failed to generate image for step {step.get('step_number')}: {e}")
                    step["generated_image"] = None
            else:
                step["generated_image"] = None
        
        return solution
    
    async def _generate_math_image(
        self,
        description: str,
        math_content: str,
        notation: List[str]
    ) -> Optional[str]:
        """Generate a mathematical explanation image using Manus AI or DALL-E"""
        
        # Create a detailed prompt for image generation
        prompt = f"""Create a clean, educational mathematical diagram:

Description: {description}

Mathematical content to visualize: {math_content}

Style requirements:
- Clean white/light background
- Clear, professional mathematical notation
- Use proper mathematical symbols
- Add visual annotations and arrows where helpful
- Highlight key relationships
- Educational and easy to understand
- High contrast for readability
"""
        
        if notation:
            prompt += f"\nUse these specific notations: {', '.join(notation)}"
        
        # Try Manus AI first, fallback to DALL-E
        try:
            return await self._manus_image_generation(prompt)
        except Exception as e:
            print(f"[Explanation] Manus AI failed: {e}, trying DALL-E")
            return await self._dalle_image_generation(prompt)
    
    async def _manus_image_generation(self, prompt: str) -> str:
        """Generate image using Manus AI"""
        if not self.manus_key:
            raise Exception("Manus API key not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.MANUS_API_BASE_URL}/images/generations",
                headers={
                    "Authorization": f"Bearer {self.manus_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "manus-image-1",
                    "prompt": prompt,
                    "n": 1,
                    "size": "1024x1024",
                    "response_format": "url"
                },
                timeout=120.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["data"][0]["url"]
            else:
                raise Exception(f"Manus AI error: {response.status_code}")
    
    async def _dalle_image_generation(self, prompt: str) -> str:
        """Fallback: Generate image using DALL-E"""
        if not self.openai_key:
            raise Exception("OpenAI API key not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "dall-e-3",
                    "prompt": prompt,
                    "n": 1,
                    "size": "1024x1024",
                    "quality": "standard"
                },
                timeout=120.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["data"][0]["url"]
            else:
                raise Exception(f"DALL-E error: {response.text}")


explanation_service = ExplanationService()
