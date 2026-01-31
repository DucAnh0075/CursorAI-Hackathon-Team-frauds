"""
Reasoning Service - Interactive step-by-step explanations with images and TTS
"""
from typing import List, Optional, Dict, Any
import httpx
import json
import base64

from app.core.config import settings


class ReasoningService:
    """Service for interactive step-by-step reasoning with images and speech"""
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.hume_key = settings.HUME_API_KEY
    
    async def analyze_problem(
        self,
        problem: str,
        image: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze a problem and return structured steps.
        Returns a plan with steps that can be revealed one at a time.
        """
        system_prompt = """You are an expert tutor. Analyze this problem and create a detailed step-by-step solution.

Return your response as JSON with this EXACT structure:
{
    "problem_summary": "Brief description of what we're solving",
    "total_steps": 4,
    "steps": [
        {
            "step_number": 1,
            "title": "Short title (3-5 words)",
            "explanation": "Detailed explanation with math using $...$ for inline math. Example: We have the recurrence $T(n) = 10T(n/3) + n^2$. From this, we can identify $a = 10$ and $b = 3$.",
            "math": "Pure LaTeX for the KEY equation of this step (no $ delimiters). Example: a = 10, \\quad b = 3, \\quad f(n) = n^2",
            "key_insight": "One sentence takeaway"
        }
    ],
    "final_answer": "Pure LaTeX for the final answer (no $ delimiters). Example: x = 5, \\quad y = \\frac{1}{2}"
}

CRITICAL FORMATTING RULES:
- "explanation": Write 2-4 sentences. USE $...$ for any math symbols like $T(n)$, $n^2$, $a = 10$, etc.
- "math": Raw LaTeX WITHOUT $ delimiters - this is the key equation displayed prominently
- "final_answer": Raw LaTeX WITHOUT $ delimiters
- "key_insight": Plain English, brief
- Maximum 5 steps
- Be thorough in explanations - explain WHY each step is done
- Write in English"""

        messages = [{"role": "system", "content": system_prompt}]
        
        if image:
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": f"Analyze this problem: {problem}"},
                    {"type": "image_url", "image_url": {"url": image}}
                ]
            })
        else:
            messages.append({"role": "user", "content": f"Analyze this problem: {problem}"})
        
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
                    "max_tokens": 2000,
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
    
    async def generate_step_image(self, image_prompt: str) -> Optional[str]:
        """Generate a simple diagram for a step using DALL-E"""
        if not self.openai_key:
            return None
            
        full_prompt = f"""Create a clean, minimalist mathematical diagram:
{image_prompt}

Style: 
- White background
- Simple black lines
- Clear labels
- No decorations
- Educational and clean"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/images/generations",
                    headers={
                        "Authorization": f"Bearer {self.openai_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "dall-e-3",
                        "prompt": full_prompt,
                        "n": 1,
                        "size": "1024x1024",
                        "quality": "standard"
                    },
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["data"][0]["url"]
        except Exception as e:
            print(f"[Reasoning] Image generation failed: {e}")
        
        return None
    
    async def generate_speech(self, text: str) -> Optional[str]:
        """Generate speech using Hume AI or OpenAI TTS"""
        
        # Try Hume AI first
        if self.hume_key:
            try:
                return await self._hume_tts(text)
            except Exception as e:
                print(f"[Reasoning] Hume TTS failed: {e}")
        
        # Fallback to OpenAI TTS
        if self.openai_key:
            try:
                return await self._openai_tts(text)
            except Exception as e:
                print(f"[Reasoning] OpenAI TTS failed: {e}")
        
        return None
    
    async def _hume_tts(self, text: str) -> str:
        """Generate speech using Hume AI"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.hume.ai/v0/tts",
                headers={
                    "X-Hume-Api-Key": self.hume_key,
                    "Content-Type": "application/json"
                },
                json={
                    "text": text,
                    "voice": "ITO",  # Hume's default voice
                    "speed": 1.0
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                # Return base64 audio
                audio_data = base64.b64encode(response.content).decode()
                return f"data:audio/mp3;base64,{audio_data}"
            else:
                raise Exception(f"Hume API error: {response.status_code}")
    
    async def _openai_tts(self, text: str) -> str:
        """Fallback: Generate speech using OpenAI TTS"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "tts-1",
                    "input": text,
                    "voice": "nova",  # Friendly voice
                    "speed": 1.0
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                audio_data = base64.b64encode(response.content).decode()
                return f"data:audio/mp3;base64,{audio_data}"
            else:
                raise Exception(f"OpenAI TTS error: {response.status_code}")


reasoning_service = ReasoningService()
