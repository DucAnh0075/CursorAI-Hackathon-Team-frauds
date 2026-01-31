"""AI-powered content generation for educational explanations."""

import os
import requests
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()


class ContentGenerator:
    """Generate educational content using AI (supports OpenAI, Minimax, Manus)."""
    
    def __init__(self, provider: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize the content generator.
        
        Args:
            provider: 'openai', 'minimax', or 'manus' (auto-detects from env vars if None)
            api_key: API key (uses env vars if None)
        """
        # Auto-detect provider from environment
        if provider is None:
            if os.getenv('MINIMAX_API_KEY'):
                provider = 'minimax'
            elif os.getenv('MANUS_API_KEY'):
                provider = 'manus'
            elif os.getenv('OPENAI_API_KEY'):
                provider = 'openai'
            else:
                raise ValueError("No API key found. Set MINIMAX_API_KEY, MANUS_API_KEY, or OPENAI_API_KEY in .env file.")
        
        self.provider = provider.lower()
        
        # Get API key
        if api_key:
            self.api_key = api_key
        elif self.provider == 'minimax':
            self.api_key = os.getenv('MINIMAX_API_KEY')
        elif self.provider == 'manus':
            self.api_key = os.getenv('MANUS_API_KEY')
        elif self.provider == 'openai':
            self.api_key = os.getenv('OPENAI_API_KEY')
        
        if not self.api_key:
            raise ValueError(f"{self.provider.upper()} API key is required. Set {self.provider.upper()}_API_KEY in .env file.")
        
        # Initialize provider-specific client
        if self.provider == 'openai':
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
            except ImportError:
                raise ImportError("openai package required. Install with: pip install openai")
        elif self.provider == 'minimax':
            self.api_key = self.api_key
            self.group_id = os.getenv('MINIMAX_GROUP_ID', '')
        elif self.provider == 'manus':
            self.api_key = self.api_key
    
    def generate_explanation(self, question: str, subject: str = "general") -> Dict[str, any]:
        """
        Generate a step-by-step explanation for a question.
        
        Returns:
            Dictionary with 'steps', 'introduction', 'conclusion', and 'key_points'
        """
        prompt = f"""You are an expert teacher creating an educational video explanation. 
        
Question/Exercise:
{question}

Create a clear, step-by-step explanation that would be suitable for a study video. 
Structure your response as follows:

1. Introduction: A brief overview of what we'll solve (2-3 sentences)
2. Step-by-step solution: Break down the solution into clear, numbered steps
3. Key points: List 2-3 important concepts or takeaways
4. Conclusion: A brief summary (1-2 sentences)

Make the explanation engaging, clear, and educational. Use simple language but be thorough.
Format your response in a way that's easy to narrate in a video."""

        try:
            if self.provider == 'openai':
                content = self._call_openai(prompt)
            elif self.provider == 'minimax':
                content = self._call_minimax(prompt)
            elif self.provider == 'manus':
                content = self._call_manus(prompt)
            else:
                raise ValueError(f"Unsupported provider: {self.provider}")
            
            # Parse the response into structured format
            return self._parse_explanation(content)
            
        except Exception as e:
            print(f"Error generating content: {e}")
            # Fallback to simple structure
            return {
                'introduction': f"Let's solve this problem step by step.",
                'steps': [
                    {'number': 1, 'text': question, 'explanation': 'This is the problem we need to solve.'}
                ],
                'key_points': ['Understanding the problem', 'Applying the solution method'],
                'conclusion': 'This completes our solution.'
            }
    
    def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API."""
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert educational content creator who makes clear, engaging explanations for students."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        return response.choices[0].message.content
    
    def _call_minimax(self, prompt: str) -> str:
        """Call Minimax API."""
        # Minimax API endpoint - try both common formats
        url = "https://api.minimax.chat/v1/text/chatcompletion_pro"
        
        # Minimax typically uses API key in headers, but format may vary
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Alternative: Some Minimax APIs use different auth format
        # If Bearer doesn't work, try: headers = {"api-key": self.api_key, ...}
        
        # Minimax API format
        payload = {
            "model": "abab6.5s-chat",  # Minimax's chat model (adjust if needed)
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert educational content creator who makes clear, engaging explanations for students."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 1500
        }
        
        # Add group_id if available (required for some Minimax accounts)
        if self.group_id:
            payload["group_id"] = self.group_id
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            # Extract content from Minimax response (handles multiple possible formats)
            if "choices" in result and len(result["choices"]) > 0:
                if "message" in result["choices"][0] and "content" in result["choices"][0]["message"]:
                    return result["choices"][0]["message"]["content"]
                elif "text" in result["choices"][0]:
                    return result["choices"][0]["text"]
            elif "reply" in result:
                return result["reply"]
            elif "content" in result:
                return result["content"]
            else:
                # Debug: print the response to help troubleshoot
                print(f"Minimax API response: {result}")
                raise ValueError(f"Unexpected Minimax response format. Response keys: {result.keys()}")
        except requests.exceptions.HTTPError as e:
            # Try alternative auth format if Bearer fails
            if e.response.status_code == 401:
                print("Warning: Bearer auth failed, trying alternative format...")
                headers_alt = {
                    "api-key": self.api_key,
                    "Content-Type": "application/json"
                }
                response = requests.post(url, json=payload, headers=headers_alt, timeout=30)
                response.raise_for_status()
                result = response.json()
                if "choices" in result and len(result["choices"]) > 0:
                    return result["choices"][0].get("message", {}).get("content", "") or result["choices"][0].get("text", "")
                elif "reply" in result:
                    return result["reply"]
            raise
    
    def _call_manus(self, prompt: str) -> str:
        """Call Manus API."""
        # Manus API endpoint (adjust based on actual API documentation)
        url = "https://api.manus.ai/v1/chat/completions"  # Update with actual endpoint
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "manus-chat",  # Update with actual model name
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert educational content creator who makes clear, engaging explanations for students."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 1500
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            # Extract content from Manus response (adjust based on actual format)
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            elif "content" in result:
                return result["content"]
            elif "text" in result:
                return result["text"]
            else:
                raise ValueError(f"Unexpected Manus response format: {result}")
        except requests.exceptions.RequestException as e:
            # Fallback: try alternative endpoint format
            print(f"Warning: Manus API call failed: {e}")
            print("Please check the Manus API documentation and update the endpoint/model name.")
            raise
    
    def _parse_explanation(self, content: str) -> Dict[str, any]:
        """Parse AI response into structured format."""
        import re
        
        result = {
            'introduction': '',
            'steps': [],
            'key_points': [],
            'conclusion': ''
        }
        
        # Extract introduction
        intro_match = re.search(r'(?:Introduction|Overview)[:\.]?\s*(.+?)(?=\n\s*(?:Step|Key|Conclusion)|$)', 
                               content, re.IGNORECASE | re.DOTALL)
        if intro_match:
            result['introduction'] = intro_match.group(1).strip()
        
        # Extract steps
        step_pattern = r'(?:Step\s+)?(\d+)[\.\)]\s*(.+?)(?=\n\s*(?:\d+[\.\)]|Step|Key|Conclusion)|$)'
        steps = re.finditer(step_pattern, content, re.IGNORECASE | re.DOTALL)
        for step in steps:
            result['steps'].append({
                'number': step.group(1),
                'text': step.group(2).strip()
            })
        
        # Extract key points
        key_points_match = re.search(r'(?:Key\s+points?|Takeaways?)[:\.]?\s*(.+?)(?=\n\s*(?:Conclusion|$))', 
                                   content, re.IGNORECASE | re.DOTALL)
        if key_points_match:
            points_text = key_points_match.group(1)
            points = re.findall(r'[•\-\*]\s*(.+?)(?=\n|$)', points_text)
            result['key_points'] = [p.strip() for p in points if p.strip()]
        
        # Extract conclusion
        conclusion_match = re.search(r'(?:Conclusion|Summary)[:\.]?\s*(.+?)$', 
                                   content, re.IGNORECASE | re.DOTALL)
        if conclusion_match:
            result['conclusion'] = conclusion_match.group(1).strip()
        
        # If parsing failed, use the whole content as steps
        if not result['steps']:
            paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
            for i, para in enumerate(paragraphs[:5], 1):  # Limit to 5 steps
                result['steps'].append({
                    'number': str(i),
                    'text': para
                })
        
        return result
    
    def generate_narration_script(self, explanation: Dict[str, any]) -> str:
        """Convert explanation into a natural narration script."""
        script_parts = []
        
        if explanation.get('introduction'):
            script_parts.append(explanation['introduction'])
        
        for step in explanation.get('steps', []):
            script_parts.append(f"Step {step['number']}: {step['text']}")
        
        if explanation.get('key_points'):
            script_parts.append("Key points to remember:")
            for point in explanation['key_points']:
                script_parts.append(point)
        
        if explanation.get('conclusion'):
            script_parts.append(explanation['conclusion'])
        
        return "\n\n".join(script_parts)
