"""
AI Service - Handles communication with AI providers
"""
from typing import List, Optional
import httpx

from app.core.config import settings
from app.models.chat import Message


class AIService:
    """Service for AI-powered responses"""
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.minimax_key = settings.MINIMAX_API_KEY
        self.manus_key = settings.MANUS_API_KEY
    
    async def generate_response(
        self,
        message: str,
        images: Optional[List[str]] = None,
        conversation_history: Optional[List[Message]] = None
    ) -> str:
        """
        Generate AI response based on available provider
        Priority: OpenAI -> Minimax -> Manus
        """
        if self.openai_key:
            return await self._openai_response(message, images, conversation_history)
        elif self.minimax_key:
            return await self._minimax_response(message, images, conversation_history)
        elif self.manus_key:
            return await self._manus_response(message, images, conversation_history)
        else:
            return self._mock_response(message)
    
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
    
    async def _minimax_response(
        self,
        message: str,
        images: Optional[List[str]] = None,
        history: Optional[List[Message]] = None
    ) -> str:
        """Generate response using Minimax API"""
        # TODO: Implement Minimax API integration
        return self._mock_response(message)
    
    async def _manus_response(
        self,
        message: str,
        images: Optional[List[str]] = None,
        history: Optional[List[Message]] = None
    ) -> str:
        """Generate response using Manus API"""
        # TODO: Implement Manus API integration
        return self._mock_response(message)
    
    def _build_messages(
        self,
        message: str,
        images: Optional[List[str]] = None,
        history: Optional[List[Message]] = None
    ) -> List[dict]:
        """Build messages array for OpenAI API"""
        messages = [
            {
                "role": "system",
                "content": """You are a helpful AI study assistant. Help users understand 
                their problems, explain concepts clearly, and provide step-by-step solutions.
                When analyzing images, describe what you see and provide relevant help."""
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
- OPENAI_API_KEY
- MINIMAX_API_KEY  
- MANUS_API_KEY

I can help you with:
• Explaining concepts step by step
• Analyzing screenshots and images
• Solving problems and exercises
• Answering questions about any topic"""
