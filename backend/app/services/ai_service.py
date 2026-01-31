"""
AI Service - Handles communication with AI providers
"""
from typing import List, Optional, AsyncGenerator
import httpx
import json

from app.core.config import settings
from app.models.chat import Message


class AIService:
    """Service for AI-powered responses using Manus AI"""
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.minimax_key = settings.MINIMAX_API_KEY
        self.manus_key = settings.MANUS_API_KEY
        self.manus_base_url = settings.MANUS_API_BASE_URL
        self.manus_model = settings.MANUS_MODEL
    
    async def generate_response(
        self,
        message: str,
        images: Optional[List[str]] = None,
        conversation_history: Optional[List[Message]] = None
    ) -> str:
        """
        Generate AI response - Manus AI is the primary provider
        Priority: Manus -> OpenAI -> Mock
        """
        if self.manus_key:
            return await self._manus_response(message, images, conversation_history)
        elif self.openai_key:
            return await self._openai_response(message, images, conversation_history)
        else:
            return self._mock_response(message)
    
    async def stream_response(
        self,
        message: str,
        images: Optional[List[str]] = None,
        conversation_history: Optional[List[Message]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream AI response for real-time feedback using Manus AI
        """
        if self.manus_key:
            async for chunk in self._manus_stream(message, images, conversation_history):
                yield chunk
        elif self.openai_key:
            async for chunk in self._openai_stream(message, images, conversation_history):
                yield chunk
        else:
            yield self._mock_response(message)
    
    async def _manus_response(
        self,
        message: str,
        images: Optional[List[str]] = None,
        history: Optional[List[Message]] = None
    ) -> str:
        """Generate response using Manus AI API"""
        async with httpx.AsyncClient() as client:
            messages = self._build_messages(message, images, history)
            
            response = await client.post(
                f"{self.manus_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.manus_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.manus_model,
                    "messages": messages,
                    "max_tokens": 4096,
                    "temperature": 0.7
                },
                timeout=120.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                raise Exception(f"Manus AI API error: {response.status_code} - {response.text}")
    
    async def _manus_stream(
        self,
        message: str,
        images: Optional[List[str]] = None,
        history: Optional[List[Message]] = None
    ) -> AsyncGenerator[str, None]:
        """Stream response using Manus AI API"""
        async with httpx.AsyncClient() as client:
            messages = self._build_messages(message, images, history)
            
            async with client.stream(
                "POST",
                f"{self.manus_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.manus_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.manus_model,
                    "messages": messages,
                    "max_tokens": 4096,
                    "temperature": 0.7,
                    "stream": True
                },
                timeout=120.0
            ) as response:
                if response.status_code != 200:
                    raise Exception(f"Manus AI API error: {response.status_code}")
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue
    
    async def _openai_response(
        self,
        message: str,
        images: Optional[List[str]] = None,
        history: Optional[List[Message]] = None
    ) -> str:
        """Generate response using OpenAI API"""
        async with httpx.AsyncClient() as client:
            messages = self._build_messages(message, images, history)
            
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": messages,
                    "max_tokens": 4096
                },
                timeout=60.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                raise Exception(f"OpenAI API error: {response.text}")
    
    async def _openai_stream(
        self,
        message: str,
        images: Optional[List[str]] = None,
        history: Optional[List[Message]] = None
    ) -> AsyncGenerator[str, None]:
        """Stream response using OpenAI API"""
        async with httpx.AsyncClient() as client:
            messages = self._build_messages(message, images, history)
            
            async with client.stream(
                "POST",
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": messages,
                    "max_tokens": 4096,
                    "stream": True
                },
                timeout=120.0
            ) as response:
                if response.status_code != 200:
                    raise Exception(f"OpenAI API error: {response.status_code}")
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue
    
    def _build_messages(
        self,
        message: str,
        images: Optional[List[str]] = None,
        history: Optional[List[Message]] = None
    ) -> List[dict]:
        """Build messages array for chat API"""
        messages = [
            {
                "role": "system",
                "content": """You are a helpful AI study assistant powered by Manus AI. 
                Help users understand their problems, explain concepts clearly, and provide step-by-step solutions.
                When analyzing images, describe what you see and provide relevant help.
                Be encouraging and supportive in your teaching style.
                
                If a user asks for a video explanation or learning video, let them know they can request 
                a video by saying "generate a video" or "create a learning video about [topic]"."""
            }
        ]
        
        # Add conversation history
        if history:
            for msg in history:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # Build current message with images
        if images:
            content = [{"type": "text", "text": message}]
            for img in images:
                content.append({
                    "type": "image_url",
                    "image_url": {"url": img}
                })
            messages.append({"role": "user", "content": content})
        else:
            messages.append({"role": "user", "content": message})
        
        return messages
    
    def _mock_response(self, message: str) -> str:
        """Mock response for development without API keys"""
        return f"""I received your message: "{message}"

This is a mock response because no API key is configured.

To get real AI responses, please configure one of these in your .env file:
- MANUS_API_KEY (Primary - recommended)
- OPENAI_API_KEY (Fallback)

I can help you with:
• Explaining concepts step by step
• Analyzing screenshots and images
• Solving problems and exercises
• Answering questions about any topic
• Generating learning videos (requires MINIMAX_API_KEY)"""


ai_service = AIService()
