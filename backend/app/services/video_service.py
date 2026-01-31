"""
Video Service - Handles video generation using MiniMax API
Creates educational/learning videos based on topics or problems
"""
from typing import Optional, Dict, Any
import httpx
import asyncio
import os
import uuid
from datetime import datetime

from app.core.config import settings


class VideoService:
    """Service for generating educational videos using MiniMax API"""
    
    def __init__(self):
        self.api_key = settings.MINIMAX_API_KEY
        self.base_url = settings.MINIMAX_API_BASE_URL
        self.group_id = settings.MINIMAX_GROUP_ID
        self.video_model = settings.MINIMAX_VIDEO_MODEL
        self.output_dir = settings.VIDEO_OUTPUT_DIR
        
        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
    
    async def generate_learning_video(
        self,
        topic: str,
        problem_context: Optional[str] = None,
        style: str = "educational"
    ) -> Dict[str, Any]:
        """
        Generate a learning help video based on a topic or problem
        
        Args:
            topic: The main topic or subject for the video
            problem_context: Optional additional context about the problem
            style: Video style - educational, explainer, tutorial
            
        Returns:
            Dict containing video_id, status, and video_url when ready
        """
        if not self.api_key:
            return {
                "success": False,
                "error": "MiniMax API key not configured",
                "message": "Please add MINIMAX_API_KEY to your .env file"
            }
        
        # Build the prompt for video generation
        prompt = self._build_video_prompt(topic, problem_context, style)
        
        try:
            # Submit video generation task
            task_result = await self._submit_video_task(prompt)
            
            if not task_result.get("success"):
                return task_result
            
            task_id = task_result.get("task_id")
            
            return {
                "success": True,
                "task_id": task_id,
                "status": "processing",
                "message": f"Video generation started for topic: {topic}",
                "estimated_time": "2-5 minutes"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to start video generation"
            }
    
    async def check_video_status(self, task_id: str) -> Dict[str, Any]:
        """
        Check the status of a video generation task
        
        Args:
            task_id: The task ID returned from generate_learning_video
            
        Returns:
            Dict containing status and video_url if completed
        """
        if not self.api_key:
            return {
                "success": False,
                "error": "MiniMax API key not configured"
            }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/video_generation",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    params={
                        "task_id": task_id
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    status = data.get("status", "unknown")
                    
                    result = {
                        "success": True,
                        "task_id": task_id,
                        "status": status
                    }
                    
                    if status == "Success":
                        file_id = data.get("file_id")
                        if file_id:
                            # Get the video download URL
                            video_url = await self._get_video_url(file_id)
                            result["video_url"] = video_url
                            result["file_id"] = file_id
                    elif status == "Fail":
                        result["error"] = data.get("error_message", "Video generation failed")
                    
                    return result
                else:
                    return {
                        "success": False,
                        "error": f"API error: {response.status_code}",
                        "details": response.text
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _submit_video_task(self, prompt: str) -> Dict[str, Any]:
        """Submit a video generation task to MiniMax API"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/video_generation",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.video_model,
                    "prompt": prompt,
                    "prompt_optimizer": True
                },
                timeout=60.0
            )
            
            if response.status_code == 200:
                data = response.json()
                task_id = data.get("task_id")
                
                if task_id:
                    return {
                        "success": True,
                        "task_id": task_id
                    }
                else:
                    return {
                        "success": False,
                        "error": "No task_id in response",
                        "details": data
                    }
            else:
                return {
                    "success": False,
                    "error": f"API error: {response.status_code}",
                    "details": response.text
                }
    
    async def _get_video_url(self, file_id: str) -> str:
        """Get the download URL for a generated video"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/files/retrieve",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                params={
                    "file_id": file_id
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("file", {}).get("download_url", "")
            
            return ""
    
    def _build_video_prompt(
        self,
        topic: str,
        problem_context: Optional[str],
        style: str
    ) -> str:
        """Build an optimized prompt for educational video generation"""
        
        base_prompt = f"Create an educational video explaining {topic}"
        
        if problem_context:
            base_prompt += f". Context: {problem_context}"
        
        style_instructions = {
            "educational": "Use clear visuals, step-by-step explanations, and engaging graphics to help students understand the concept.",
            "explainer": "Create a concise explainer video with animations and clear narration that breaks down the topic into simple parts.",
            "tutorial": "Make a hands-on tutorial style video showing practical examples and demonstrations."
        }
        
        style_text = style_instructions.get(style, style_instructions["educational"])
        
        full_prompt = f"{base_prompt}. {style_text} The video should be engaging, clear, and suitable for learning purposes."
        
        return full_prompt
    
    async def generate_video_with_polling(
        self,
        topic: str,
        problem_context: Optional[str] = None,
        style: str = "educational",
        max_wait_seconds: int = 300,
        poll_interval: int = 10
    ) -> Dict[str, Any]:
        """
        Generate a video and wait for completion with polling
        
        Args:
            topic: The main topic for the video
            problem_context: Optional additional context
            style: Video style
            max_wait_seconds: Maximum time to wait for completion
            poll_interval: Seconds between status checks
            
        Returns:
            Dict with final status and video_url if successful
        """
        # Start the generation
        result = await self.generate_learning_video(topic, problem_context, style)
        
        if not result.get("success"):
            return result
        
        task_id = result.get("task_id")
        elapsed = 0
        
        # Poll for completion
        while elapsed < max_wait_seconds:
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval
            
            status_result = await self.check_video_status(task_id)
            
            if not status_result.get("success"):
                return status_result
            
            status = status_result.get("status")
            
            if status == "Success":
                return status_result
            elif status == "Fail":
                return {
                    "success": False,
                    "error": status_result.get("error", "Video generation failed"),
                    "task_id": task_id
                }
        
        return {
            "success": False,
            "error": "Video generation timed out",
            "task_id": task_id,
            "status": "timeout"
        }


video_service = VideoService()
