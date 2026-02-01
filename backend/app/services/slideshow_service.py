"""
Slideshow Service - Blackboard-style educational videos
Like a teacher writing on a board while explaining
"""
from typing import Optional, Dict, Any, List
import httpx
import json
import base64
import os
import uuid
import re

from app.core.config import settings


class SlideshowService:
    """Generate blackboard-style educational slideshows"""
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.hume_key = settings.HUME_API_KEY
        self.output_dir = os.path.join(settings.VIDEO_OUTPUT_DIR, "slideshows")
        os.makedirs(self.output_dir, exist_ok=True)
    
    async def generate_slideshow(
        self,
        problem: str,
        reasoning_analysis: Optional[Dict[str, Any]] = None,
        image: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate a blackboard-style slideshow"""
        try:
            # Generate lesson content
            lesson = await self._generate_lesson(problem, image)
            
            # Create slides
            slides = self._create_slides(lesson)
            
            # Generate audio
            slides_with_audio = await self._generate_all_audio(slides)
            
            return {
                "success": True,
                "slideshow_id": str(uuid.uuid4()),
                "title": lesson.get("title", "Math Lesson"),
                "slides": slides_with_audio,
                "total_slides": len(slides_with_audio),
                "estimated_duration": sum(s.get("duration", 15) for s in slides_with_audio)
            }
            
        except Exception as e:
            print(f"[Slideshow] Error: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}
    
    async def _generate_lesson(self, problem: str, image: Optional[str] = None) -> Dict[str, Any]:
        """Generate lesson content"""
        
        prompt = '''You are creating an educational video like a teacher at a blackboard.

LOOK AT THE IMAGE and extract the ACTUAL MATH PROBLEM. The user's text is just a comment - IGNORE IT.

Return this JSON:

{
    "title": "Solving [Problem Type]",
    "problem": "The EXACT math from the image",
    "topic": "Master Theorem / Calculus / etc",
    
    "boards": [
        {
            "title": "Welcome",
            "lines": ["Topic: Master Theorem", "Goal: Find asymptotic bound"],
            "voice": "Hey there! Today we are going to solve this problem together."
        },
        {
            "title": "The Problem", 
            "lines": ["Matrix A:", "| -1   2 |", "|  2  -4 |", "Solve: u' = Au"],
            "voice": "Here is our matrix A. We need to solve u prime equals A times u."
        }
    ]
}

MATH NOTATION - USE LATEX:

Wrap ALL math in $...$ for inline or $$...$$ for display.

EXAMPLES:
- Matrix: "$A = \\begin{pmatrix} -1 & 2 \\\\ 2 & -4 \\end{pmatrix}$"
- Equation: "$u' = Au$"
- Eigenvalues: "$\\lambda_1 = 0, \\lambda_2 = -5$"
- Determinant: "$\\det(A) = (-1)(-4) - (2)(2) = 0$"
- Characteristic: "$\\lambda^2 + 5\\lambda = 0$"
- Vector: "$v = \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$"
- Fraction: "$\\frac{a}{b}$"
- Square root: "$\\sqrt{x}$"
- Greek: $\\lambda$, $\\theta$, $\\alpha$, $\\beta$
- Subscripts: $x_1$, $\\log_3(10)$
- Superscripts: $n^2$, $e^{\\lambda t}$
- Big-O: "$\\Theta(n^{\\log_3 10})$"

IMPORTANT:
- Every math expression MUST be wrapped in $ signs
- Use \\begin{pmatrix}...\\end{pmatrix} for matrices
- Use \\\\ for newlines in matrices
- Use & to separate columns

VOICE - speak math naturally:
- "negative 1" not "-1"
- "2 by 2 matrix"
- "lambda equals"
- "the determinant is"

GENERATE 10-12 boards, 2-4 lines each, 40-60 words per voice.'''

        messages = [{"role": "system", "content": prompt}]
        
        if image:
            image_url = image if image.startswith('data:') or image.startswith('http') else f"data:image/jpeg;base64,{image}"
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": f"Create a detailed lesson (12-15 boards) for the problem in this image. User said: '{problem}' (ignore this, extract from image)"},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            })
        else:
            messages.append({"role": "user", "content": f"Create a detailed lesson (12-15 boards) for: {problem}"})
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.openai_key}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o",
                    "messages": messages,
                    "max_tokens": 5000,
                    "temperature": 0.7,
                    "response_format": {"type": "json_object"}
                },
                timeout=120.0
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                lesson = json.loads(content)
                print(f"[Slideshow] Generated {len(lesson.get('boards', []))} boards")
                return lesson
            else:
                raise Exception(f"OpenAI error: {response.status_code} - {response.text[:200]}")
    
    def _create_slides(self, lesson: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Convert boards to slides"""
        slides = []
        
        for i, board in enumerate(lesson.get("boards", [])):
            slides.append({
                "type": "blackboard",
                "title": board.get("title", f"Step {i+1}"),
                "lines": board.get("lines", []),
                "speaker_notes": board.get("voice", ""),
                "duration": 18,
                "background": "blackboard"
            })
        
        if not slides:
            slides.append({
                "type": "blackboard",
                "title": "Problem",
                "lines": [lesson.get("problem", "Let's solve this!")],
                "speaker_notes": "Let's work through this problem together step by step.",
                "duration": 15,
                "background": "blackboard"
            })
        
        return slides
    
    async def _generate_all_audio(self, slides: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate audio for all slides"""
        result = []
        
        for i, slide in enumerate(slides):
            slide_copy = slide.copy()
            notes = slide.get("speaker_notes", "")
            
            if notes:
                print(f"[Slideshow] Audio {i+1}/{len(slides)}: {notes[:50]}...")
                audio = await self._generate_voice(notes)
                if audio:
                    slide_copy["audio"] = audio
                    slide_copy["has_audio"] = True
                    print(f"[Slideshow] ✓ Audio {i+1}")
                else:
                    slide_copy["has_audio"] = False
                    print(f"[Slideshow] ✗ Audio {i+1} failed")
            else:
                slide_copy["has_audio"] = False
                print(f"[Slideshow] ⚠ Slide {i+1} has no voice text")
            
            result.append(slide_copy)
        
        return result
    
    async def _generate_voice(self, text: str) -> Optional[str]:
        """Generate voice narration using Hume AI with OpenAI fallback"""
        if not text.strip():
            return None
        
        # Try Hume AI first
        if self.hume_key:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.hume.ai/v0/tts/file",
                        headers={"X-Hume-Api-Key": self.hume_key, "Content-Type": "application/json"},
                        json={
                            "utterances": [{
                                "text": text,
                                "description": "A friendly, warm female teacher explaining math. Speak clearly and enthusiastically, like you're excited to help a student understand."
                            }],
                            "format": {"type": "mp3"}
                        },
                        timeout=60.0
                    )
                    
                    print(f"[Slideshow] Hume AI: {response.status_code}")
                    if response.status_code == 200:
                        audio = base64.b64encode(response.content).decode()
                        return f"data:audio/mp3;base64,{audio}"
                    elif response.status_code == 429:
                        print(f"[Slideshow] Hume rate limited, falling back to OpenAI")
                    else:
                        print(f"[Slideshow] Hume error: {response.text[:100]}")
            except Exception as e:
                print(f"[Slideshow] Hume failed: {e}")
        
        # Fallback to OpenAI TTS
        if self.openai_key:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.openai.com/v1/audio/speech",
                        headers={"Authorization": f"Bearer {self.openai_key}", "Content-Type": "application/json"},
                        json={
                            "model": "tts-1-hd",
                            "input": text,
                            "voice": "shimmer",
                            "speed": 0.95
                        },
                        timeout=60.0
                    )
                    
                    if response.status_code == 200:
                        print(f"[Slideshow] OpenAI TTS fallback: 200")
                        audio = base64.b64encode(response.content).decode()
                        return f"data:audio/mp3;base64,{audio}"
            except Exception as e:
                print(f"[Slideshow] OpenAI TTS also failed: {e}")
        
        return None


slideshow_service = SlideshowService()
