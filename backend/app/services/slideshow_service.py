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
        self.minimax_key = settings.MINIMAX_API_KEY
        self.minimax_api_host = "https://api.minimax.io"  # Global API
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
            "lines": ["Topic: Master Theorem", "Goal: Find $\\\\Theta$ bound"],
            "voice": "Hey there! Today we are going to solve this problem together."
        },
        {
            "title": "The Problem", 
            "lines": ["$A = \\\\begin{pmatrix} -1 & 2 \\\\\\\\ 2 & -4 \\\\end{pmatrix}$", "Solve: $u' = Au$"],
            "voice": "Here is our matrix A. We need to solve u prime equals A times u."
        },
        {
            "title": "Comparison",
            "lines": ["$n^2$ vs $n^{\\\\log_3 10}$", "Since $3^2 = 9 < 10$", "$\\\\log_3(10) > 2$"],
            "voice": "Let's compare n squared with n to the log base 3 of 10."
        }
    ]
}

CRITICAL - ALL MATH MUST USE LATEX WITH DOLLAR SIGNS:

EVERY mathematical expression must be wrapped in $...$ signs. No exceptions!

CORRECT examples:
- "$n^2$" NOT "n^2"
- "$\\\\log_3(10)$" NOT "log_3(10)"  
- "$\\\\lambda_1 = 0$" NOT "λ_1 = 0"
- "$A = \\\\begin{pmatrix} a & b \\\\\\\\ c & d \\\\end{pmatrix}$"
- "$\\\\Theta(n^{\\\\log_b a})$"
- "$\\\\frac{a}{b}$"
- "$\\\\sqrt{x}$"
- "$e^{\\\\lambda t}$"

WRONG - DO NOT OUTPUT:
- n^2, n^log_3(10), log_3(10) > 2 (missing $ signs!)
- λ, Θ (use $\\\\lambda$, $\\\\Theta$ instead)

VOICE - speak math naturally:
- "n squared" not "n^2"
- "log base 3 of 10"
- "lambda equals"

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
        """Generate voice narration using MiniMax API with OpenAI fallback"""
        if not text.strip():
            return None
        
        # Try MiniMax first
        if self.minimax_key:
            print(f"[Slideshow] Trying MiniMax TTS...")
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{self.minimax_api_host}/v1/t2a_v2",
                        headers={
                            "Authorization": f"Bearer {self.minimax_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "speech-02-hd",
                            "text": text,
                            "voice_setting": {
                                "voice_id": "male-qn-qingse",  # Calm, clear male voice like The Organic Chemistry Tutor
                                "speed": 0.95,  # Slightly slower for clarity
                                "vol": 1.0,
                                "pitch": 0
                            },
                            "audio_setting": {
                                "sample_rate": 32000,
                                "bitrate": 128000,
                                "format": "mp3",
                                "channel": 1
                            }
                        },
                        timeout=60.0
                    )
                    
                    print(f"[Slideshow] MiniMax TTS: {response.status_code}")
                    if response.status_code == 200:
                        data = response.json()
                        audio_hex = data.get('data', {}).get('audio', '')
                        if audio_hex:
                            audio_bytes = bytes.fromhex(audio_hex)
                            audio = base64.b64encode(audio_bytes).decode()
                            return f"data:audio/mp3;base64,{audio}"
                        else:
                            print(f"[Slideshow] MiniMax: No audio in response")
                    elif response.status_code == 429:
                        print(f"[Slideshow] MiniMax rate limited, falling back to OpenAI")
                    else:
                        print(f"[Slideshow] MiniMax error: {response.text[:200]}")
            except Exception as e:
                print(f"[Slideshow] MiniMax failed: {e}")
        else:
            print(f"[Slideshow] No MiniMax API key, using OpenAI")
        
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
