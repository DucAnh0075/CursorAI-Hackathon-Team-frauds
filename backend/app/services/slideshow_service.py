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

LOOK AT THE IMAGE and extract the ACTUAL MATH PROBLEM. The user's text is just a comment like "i dont understand" - IGNORE IT.

Return this JSON:

{
    "title": "Solving [Problem Type]",
    "problem": "The EXACT math from the image, e.g. T(n) = 10T(n/3) + n^2",
    "topic": "Master Theorem / Calculus / etc",
    
    "boards": [
        {
            "title": "Welcome",
            "lines": ["Today: Master Theorem"],
            "voice": "Hey there! Today we are going to solve this recurrence relation step by step. I know it looks intimidating, but trust me - by the end of this, you will understand exactly how it works. Let me show you."
        },
        {
            "title": "The Problem",
            "lines": ["T(n) = 10T(n/3) + n^2", "Find: asymptotic bound"],
            "voice": "So here is what we are working with. T of n equals 10 times T of n over 3, plus n squared. We need to find its asymptotic bound. The Master Theorem is perfect for this type of problem."
        },
        {
            "title": "Step 1: Identify Values",
            "lines": ["a = 10 (subproblems)", "b = 3 (division)", "f(n) = n^2 (extra work)"],
            "voice": "First, let me identify the key values. a equals 10 - that is how many subproblems we create. b equals 3 - we divide the input by 3. And f of n equals n squared - that is the extra work at each level. Write these down!"
        },
        {
            "title": "Step 2: Calculate Critical Value",
            "lines": ["Calculate log_b(a)", "log_3(10) = 2.096...", "approximately 2.1"],
            "voice": "Now the key step - we need log base b of a. That is log base 3 of 10. Let me calculate... that is approximately 2.096, or about 2.1. This number tells us how fast the subproblems multiply."
        },
        {
            "title": "Step 3: Compare",
            "lines": ["f(n) = n^2", "n^(log_3(10)) = n^2.1", "n^2 < n^2.1"],
            "voice": "Now we compare f of n with n to the power of log b of a. Our f of n is n squared. And n to the 2.1 grows faster than n squared. So f of n is smaller - this tells us which case of the Master Theorem applies."
        },
        {
            "title": "Step 4: Apply the Theorem",
            "lines": ["Case 1 applies:", "f(n) = O(n^(log_b(a) - epsilon))", "Result: T(n) = Theta(n^(log_3(10)))"],
            "voice": "Since f of n grows slower, we are in Case 1 of the Master Theorem. This means our answer is Theta of n to the power of log base 3 of 10. The recursive calls dominate the extra work."
        },
        {
            "title": "Final Answer",
            "lines": ["T(n) = Theta(n^(log_3(10)))", "= Theta(n^2.1)", "Done!"],
            "voice": "And there is our final answer! T of n equals Theta of n to the log base 3 of 10, which is approximately n to the 2.1. You did it! The key was identifying a, b, and f of n, then comparing to find which case applies."
        }
    ]
}

REQUIREMENTS:
1. Generate 7-10 boards
2. Each board: 1-4 lines of math/text
3. Each voice: 50-80 words - EXPLAIN while writing, dont just read
4. Use simple spoken math: "n squared" not "n^2", "log base 3 of 10" not "log_3(10)"
5. Sound like a patient teacher: "Let me show you...", "Notice how...", "The trick is..."
6. NO LaTeX in voice - convert all math to spoken words'''

        messages = [{"role": "system", "content": prompt}]
        
        if image:
            image_url = image if image.startswith('data:') or image.startswith('http') else f"data:image/jpeg;base64,{image}"
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": f"Create a lesson for this problem. User said: '{problem}' (ignore this, look at image)"},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            })
        else:
            messages.append({"role": "user", "content": f"Create a lesson for: {problem}"})
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.openai_key}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o",
                    "messages": messages,
                    "max_tokens": 4000,
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
        """Generate voice narration"""
        if not text.strip():
            return None
        
        # Try Hume AI
        if self.hume_key:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.hume.ai/v0/tts/file",
                        headers={"X-Hume-Api-Key": self.hume_key, "Content-Type": "application/json"},
                        json={
                            "utterances": [{
                                "text": text,
                                "description": "A warm, patient math teacher. Calm, clear, friendly tone. Speaks at a moderate pace."
                            }],
                            "format": {"type": "mp3"},
                            "num_generations": 1
                        },
                        timeout=60.0
                    )
                    
                    print(f"[Slideshow] Hume: {response.status_code}")
                    if response.status_code == 200:
                        audio = base64.b64encode(response.content).decode()
                        return f"data:audio/mp3;base64,{audio}"
                    else:
                        print(f"[Slideshow] Hume error: {response.text[:100]}")
            except Exception as e:
                print(f"[Slideshow] Hume failed: {e}")
        
        # Fallback to OpenAI
        if self.openai_key:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.openai.com/v1/audio/speech",
                        headers={"Authorization": f"Bearer {self.openai_key}", "Content-Type": "application/json"},
                        json={
                            "model": "tts-1-hd",
                            "input": text,
                            "voice": "nova",
                            "speed": 0.92
                        },
                        timeout=45.0
                    )
                    
                    if response.status_code == 200:
                        audio = base64.b64encode(response.content).decode()
                        return f"data:audio/mp3;base64,{audio}"
            except Exception as e:
                print(f"[Slideshow] OpenAI TTS failed: {e}")
        
        return None


slideshow_service = SlideshowService()
