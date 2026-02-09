"""
AI Service - Handles communication with AI providers
"""
from typing import List, Optional, AsyncGenerator
import httpx
import json

from app.core.config import settings
from app.models.chat import Message


class AIService:
    """Service for AI-powered responses using LangChain with fallbacks"""
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
        self.minimax_key = settings.MINIMAX_API_KEY
        self.manus_key = settings.MANUS_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY
        self.minimax_chat_url = settings.MINIMAX_CHAT_URL
        self.minimax_chat_model = settings.MINIMAX_CHAT_MODEL
        self.manus_base_url = settings.MANUS_API_BASE_URL
        self.manus_model = settings.MANUS_MODEL
        self.gemini_base_url = settings.GEMINI_API_BASE_URL
        self.gemini_model = settings.GEMINI_MODEL
    
    async def generate_response(
        self,
        message: str,
        images: Optional[List[str]] = None,
        conversation_history: Optional[List[Message]] = None,
        model: str = "langchain",
        reasoning_mode: bool = False
    ) -> str:
        """
        Generate AI response with specified model
        Models: "langchain", "minimax", "manus", "openai", or "gemini"
        reasoning_mode: enables step-by-step explanations with visual markers
        """
        # Use LangChain as primary (Gemini via LangChain, prioritized)
        if model == "langchain" and self.gemini_key:
            try:
                print(f"[AI Service] Using LangChain (Gemini), reasoning_mode: {reasoning_mode}")
                return await self._langchain_response(message, images, conversation_history, reasoning_mode)
            except Exception as e:
                print(f"[AI Service] LangChain error: {e}")
                # Fall back to direct Gemini API
                try:
                    print(f"[AI Service] Falling back to direct Gemini API")
                    return await self._gemini_response(message, images, conversation_history, reasoning_mode)
                except Exception as e2:
                    print(f"[AI Service] Direct Gemini also failed: {e2}")
                    if self.openai_key:
                        try:
                            print(f"[AI Service] Falling back to OpenAI")
                            return await self._openai_response(message, images, conversation_history, reasoning_mode)
                        except Exception as e3:
                            print(f"[AI Service] OpenAI also failed: {e3}")
                return self._mock_response(message)

        # Use MiniMax if selected and key is available
        if model == "minimax" and self.minimax_key:
            try:
                print(f"[AI Service] Using MiniMax API, reasoning_mode: {reasoning_mode}")
                return await self._minimax_response(message, images, conversation_history, reasoning_mode)
            except Exception as e:
                print(f"[AI Service] MiniMax API error: {e}")
                # Fall back to Manus or direct providers
                if self.manus_key:
                    print(f"[AI Service] Falling back to Manus")
                    return await self._manus_response(message, images, conversation_history, reasoning_mode)
                if self.gemini_key:
                    print(f"[AI Service] Falling back to Gemini")
                    return await self._gemini_response(message, images, conversation_history, reasoning_mode)
                if self.openai_key:
                    print(f"[AI Service] Falling back to OpenAI")
                    return await self._openai_response(message, images, conversation_history, reasoning_mode)
                return self._mock_response(message)

        # Use Manus AI if selected and key is available (most reliable)
        if model == "manus" and self.manus_key:
            try:
                print(f"[AI Service] Using Manus AI API, reasoning_mode: {reasoning_mode}")
                return await self._manus_response(message, images, conversation_history, reasoning_mode)
            except Exception as e:
                print(f"[AI Service] Manus AI API error: {e}")
                # Fall back to Gemini or OpenAI
                if self.gemini_key:
                    print(f"[AI Service] Falling back to Gemini")
                    return await self._gemini_response(message, images, conversation_history, reasoning_mode)
                elif self.openai_key:
                    print(f"[AI Service] Falling back to OpenAI")
                    return await self._openai_response(message, images, conversation_history, reasoning_mode)
                return self._mock_response(message)
        
        # Use Gemini AI if selected and key is available
        if model == "gemini" and self.gemini_key:
            try:
                print(f"[AI Service] Using Gemini AI API, reasoning_mode: {reasoning_mode}")
                return await self._gemini_response(message, images, conversation_history, reasoning_mode)
            except Exception as e:
                print(f"[AI Service] Gemini AI API error: {e}")
                # Fall back to OpenAI if available
                if self.openai_key:
                    print(f"[AI Service] Falling back to OpenAI")
                    return await self._openai_response(message, images, conversation_history, reasoning_mode)
                return self._mock_response(message)
        
        # Use OpenAI if selected
        if model == "openai" and self.openai_key:
            try:
                print(f"[AI Service] Using OpenAI API (gpt-4o), reasoning_mode: {reasoning_mode}")
                return await self._openai_response(message, images, conversation_history, reasoning_mode)
            except Exception as e:
                print(f"[AI Service] OpenAI API error: {e}")
                # Fall back to Gemini
                if self.gemini_key:
                    print(f"[AI Service] Falling back to Gemini")
                    return await self._gemini_response(message, images, conversation_history, reasoning_mode)
                return self._mock_response(message)
        
        # Default fallback order: Gemini -> LangChain -> OpenAI -> Mock
        if self.gemini_key:
            try:
                print(f"[AI Service] Using Gemini AI API (default)")
                return await self._gemini_response(message, images, conversation_history, reasoning_mode)
            except Exception as e:
                print(f"[AI Service] Gemini error: {e}")

        if self.gemini_key or self.openai_key:
            try:
                print(f"[AI Service] Using LangChain (default fallback)")
                return await self._langchain_response(message, images, conversation_history, reasoning_mode)
            except Exception as e:
                print(f"[AI Service] LangChain error: {e}")
        
        if self.openai_key:
            try:
                print(f"[AI Service] Using OpenAI (default fallback)")
                return await self._openai_response(message, images, conversation_history, reasoning_mode)
            except Exception as e:
                print(f"[AI Service] OpenAI error: {e}")
        
        print(f"[AI Service] No API keys available, using mock response")
        return self._mock_response(message)

    async def _langchain_response(
        self,
        message: str,
        images: Optional[List[str]] = None,
        history: Optional[List[Message]] = None,
        reasoning_mode: bool = False
    ) -> str:
        """Generate response using LangChain wrappers (Gemini/OpenAI)."""
        if images:
            # Prefer native multimodal providers for images
            if self.gemini_key:
                return await self._gemini_response(message, images, history, reasoning_mode)
            if self.openai_key:
                return await self._openai_response(message, images, history, reasoning_mode)

        try:
            from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
            if self.gemini_key:
                from langchain_google_genai import ChatGoogleGenerativeAI
                llm = ChatGoogleGenerativeAI(
                    model=self.gemini_model,
                    google_api_key=self.gemini_key,
                    temperature=0.7
                )
            elif self.openai_key:
                from langchain_openai import ChatOpenAI
                llm = ChatOpenAI(
                    model="gpt-4o-mini",
                    api_key=self.openai_key,
                    temperature=0.7
                )
            else:
                raise Exception("No LangChain-supported API key available")

            messages = []
            if reasoning_mode:
                messages.append(SystemMessage(content="You are a math tutor. Explain problems STEP BY STEP with numbered steps, calculations, and insights."))

            if history:
                for msg in history[-10:]:
                    if msg.role == "user":
                        messages.append(HumanMessage(content=msg.content))
                    else:
                        messages.append(AIMessage(content=msg.content))

            messages.append(HumanMessage(content=message))

            result = llm.invoke(messages)
            return result.content
        except Exception as e:
            raise Exception(f"LangChain error: {e}")

    async def _minimax_response(
        self,
        message: str,
        images: Optional[List[str]] = None,
        history: Optional[List[Message]] = None,
        reasoning_mode: bool = False
    ) -> str:
        """Generate response using MiniMax chat endpoint (OpenAI-compatible)."""
        if not self.minimax_chat_url or not self.minimax_chat_model:
            return "MiniMax chat is not configured. Please set MINIMAX_CHAT_URL and MINIMAX_CHAT_MODEL."

        if images:
            # MiniMax text chat may not support images; fall back to Gemini/OpenAI if available
            if self.gemini_key:
                return await self._gemini_response(message, images, history, reasoning_mode)
            if self.openai_key:
                return await self._openai_response(message, images, history, reasoning_mode)

        messages = self._build_messages(message, images=None, history=history, reasoning_mode=reasoning_mode)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.minimax_chat_url,
                headers={
                    "Authorization": f"Bearer {self.minimax_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.minimax_chat_model,
                    "messages": messages,
                    "temperature": 0.7
                },
                timeout=120.0
            )

            if response.status_code == 200:
                data = response.json()
                if "choices" in data and data["choices"]:
                    return data["choices"][0]["message"]["content"]
                raise Exception("No content in MiniMax response")
            raise Exception(f"MiniMax API error: {response.status_code} - {response.text}")
    
    async def stream_response(
        self,
        message: str,
        images: Optional[List[str]] = None,
        conversation_history: Optional[List[Message]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream AI response for real-time feedback
        Falls back through: Gemini (non-streaming) -> Manus -> OpenAI -> mock
        """
        if self.gemini_key:
            # Gemini doesn't have streaming in our implementation, so yield full response
            try:
                result = await self._gemini_response(message, images, conversation_history)
                yield result
                return
            except Exception as e:
                print(f"[AI Service] Gemini stream fallback failed: {e}")
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
        history: Optional[List[Message]] = None,
        reasoning_mode: bool = False
    ) -> str:
        """Generate response using Manus AI API (OpenAI SDK compatible)"""
        try:
            async with httpx.AsyncClient() as client:
                messages = self._build_messages(message, images, history, reasoning_mode)
                
                # Manus uses OpenAI-compatible endpoint at /v1/chat/completions
                response = await client.post(
                    f"{self.manus_base_url}/v1/chat/completions",
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
                    print(f"Manus AI API error: {response.status_code} - {response.text}")
                    # Fall back to Gemini first, then OpenAI
                    if self.gemini_key:
                        return await self._gemini_response(message, images, history)
                    if self.openai_key:
                        return await self._openai_response(message, images, history)
                    return self._mock_response(message)
        except Exception as e:
            print(f"Manus AI error: {e}")
            # Fall back to Gemini first, then OpenAI
            if self.gemini_key:
                return await self._gemini_response(message, images, history)
            if self.openai_key:
                return await self._openai_response(message, images, history)
            return self._mock_response(message)
    
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
    
    async def _gemini_response(
        self,
        message: str,
        images: Optional[List[str]] = None,
        history: Optional[List[Message]] = None,
        reasoning_mode: bool = False
    ) -> str:
        """Generate response using Google Gemini API with retry logic"""
        import asyncio
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient() as client:
                    # Build Gemini-format messages
                    contents = []
                    
                    # Add history
                    if history:
                        for msg in history[-10:]:  # Last 10 messages for context
                            role = "user" if msg.role == "user" else "model"
                            contents.append({"role": role, "parts": [{"text": msg.content}]})
                    
                    # Add current message with images
                    parts = []
                    if images:
                        for img in images:
                            if img.startswith('data:image'):
                                # Extract base64 data
                                img_data = img.split(',')[1] if ',' in img else img
                                mime_type = img.split(';')[0].split(':')[1] if 'data:' in img else 'image/jpeg'
                                parts.append({
                                    "inline_data": {
                                        "mime_type": mime_type,
                                        "data": img_data
                                    }
                                })
                    
                    parts.append({"text": message})
                    contents.append({"role": "user", "parts": parts})
                    
                    # System instruction for reasoning mode
                    system_instruction = None
                    if reasoning_mode:
                        system_instruction = {
                            "parts": [{
                                "text": "You are a math tutor. Explain problems STEP BY STEP with numbered steps, calculations, and insights."
                            }]
                        }
                    
                    # Build request body
                    request_body = {
                        "contents": contents,
                        "generationConfig": {
                            "temperature": 0.7,
                            "maxOutputTokens": 8192
                        }
                    }
                    if system_instruction:
                        request_body["systemInstruction"] = system_instruction
                    
                    # Make request
                    response = await client.post(
                        f"{self.gemini_base_url}/models/{self.gemini_model}:generateContent?key={self.gemini_key}",
                        headers={"Content-Type": "application/json"},
                        json=request_body,
                        timeout=120.0
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if "candidates" in data and len(data["candidates"]) > 0:
                            content = data["candidates"][0]["content"]
                            if "parts" in content and len(content["parts"]) > 0:
                                return content["parts"][0]["text"]
                        raise Exception("No content in Gemini response")
                    elif response.status_code == 429:
                        # Rate limited - wait and retry
                        wait_time = (attempt + 1) * 5  # 5, 10, 15 seconds
                        print(f"[Gemini] Rate limited, waiting {wait_time}s before retry {attempt + 1}/{max_retries}")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        raise Exception(f"Gemini API error: {response.status_code} - {response.text}")
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"Gemini AI error after {max_retries} attempts: {e}")
                    raise
                print(f"[Gemini] Attempt {attempt + 1} failed: {e}")
        
        raise Exception("Gemini API failed after all retries")
    
    async def _openai_response(
        self,
        message: str,
        images: Optional[List[str]] = None,
        history: Optional[List[Message]] = None,
        reasoning_mode: bool = False
    ) -> str:
        """Generate response using OpenAI API"""
        async with httpx.AsyncClient() as client:
            messages = self._build_messages(message, images, history, reasoning_mode)
            
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
                timeout=120.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                error_msg = f"OpenAI API error: {response.status_code} - {response.text}"
                print(f"[API Error] {error_msg}")
                raise Exception(error_msg)
    
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
        history: Optional[List[Message]] = None,
        reasoning_mode: bool = False
    ) -> List[dict]:
        """Build messages array for chat API"""
        
        if reasoning_mode:
            system_content = """Du bist ein Mathe-Tutor im REASONING MODE. Du erklärst Probleme SCHRITT FÜR SCHRITT.

WICHTIGE REGELN FÜR REASONING MODE:

1. STRUKTUR - Teile JEDE Antwort in nummerierte Schritte:
   
   ## Schritt 1: [Titel]
   [Erklärung was wir hier machen und WARUM]
   
   **Berechnung:**
   \\[ mathematische Formel \\]
   
   💡 **Erkenntnis:** [Was haben wir gelernt?]
   
   ---
   
   ## Schritt 2: [Titel]
   ...usw.

2. VISUALISIERUNG - Beschreibe bei jedem Schritt, was man sich visuell vorstellen soll:
   - Verwende 📍 für wichtige Punkte
   - Verwende ➡️ für Übergänge/Ableitungen
   - Verwende 🔴 🟢 🔵 für Markierungen
   - Beschreibe geometrische Zusammenhänge

3. NOTATION - Verwende EXAKT die gleiche Notation wie im Bild/Problem:
   - Gleiche Variablennamen
   - Gleiche Indizes
   - Gleiche Symbole

4. ERKLÄRUNG - Bei JEDEM Schritt:
   - Was machen wir? (Aktion)
   - Warum machen wir das? (Begründung)
   - Was bedeutet das Ergebnis? (Interpretation)

5. MATH FORMAT:
   - Inline: \\( formel \\)
   - Display/Block: \\[ formel \\]

6. Am Ende:
   ## ✅ Endergebnis
   [Klare Zusammenfassung]
   
   ## 🧵 Roter Faden
   [Wie hängen alle Schritte zusammen? Was war die Strategie?]"""
        else:
            system_content = """You are a helpful AI study assistant. 
Help users understand their problems, explain concepts clearly, and provide step-by-step solutions.
When analyzing images, describe what you see and provide relevant help.
Be encouraging and supportive in your teaching style.

IMPORTANT: When writing mathematical expressions, ALWAYS use LaTeX delimiters:
- Use \\( ... \\) for inline math (e.g., \\(x^2 + y^2 = r^2\\))
- Use \\[ ... \\] for display/block math equations (e.g., \\[\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\\])
- NEVER use raw LaTeX without these delimiters
- NEVER use $ or $$ delimiters"""
        
        messages = [{"role": "system", "content": system_content}]
        
        # Add conversation history
        if history:
            for msg in history:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # Build current message with images
        if images and len(images) > 0:
            print(f"[AI Service] Building message with {len(images)} images")
            content = [{"type": "text", "text": message}]
            for i, img in enumerate(images):
                print(f"[AI Service] Adding image {i}: {img[:50]}...")
                content.append({
                    "type": "image_url",
                    "image_url": {"url": img}
                })
            messages.append({"role": "user", "content": content})
        else:
            print(f"[AI Service] Building message without images")
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
