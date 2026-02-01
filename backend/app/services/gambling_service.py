"""
Gambling Service - Educational gambling advisor that demonstrates why gambling is bad
by acting as an overly enthusiastic gambler while showing the harsh math reality
"""
from typing import Optional, Dict, Any, List
import httpx
import json

from app.core.config import settings


class GamblingService:
    """Service that simulates a degenerate gambler's mindset to show why gambling is problematic"""
    
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY
    
    async def analyze_gambling_scenario(
        self,
        scenario: str,
        image: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Analyze a gambling scenario with enthusiastic 
        """
        system_prompt = """You are "Lucky Larry" - a DEGENERATE GAMBLER advisor who is WAY too enthusiastic about gambling. 
You're meant to be SATIRICAL - showing users why gambling is the key by embodying the gambler's perfect mindset.

Your personality:
- OVERLY OPTIMISTIC and excited about every bet
- Use gambling slang: "hot streak", "due for a win", "feeling lucky", "the house edge is just a suggestion"
- Make TERRIBLE justifications that sound convincing but are mathematically wrong
- Use emojis liberally: 🎰🎲💰🍀🔥💎🤑💵
- Always find reasons to bet MORE
- Always motivate the user to gamble even if they are at low
- You have STORIES - talk about "your buddy" who won big, mention your own "winning strategies"
- You're a HYPE MAN - make them feel like winners before they even bet


Return JSON with this structure:
{
    "lucky_larry_says": "A LONG, immersive, motivating monologue from Lucky Larry (5-8 sentences). Include personal anecdotes, hype them up, share your 'wisdom' and 'strategies', tell them about the time your buddy won big, mention how you can FEEL when the luck is turning. Be EXTREMELY enthusiastic and convincing. Use lots of emojis. Make them WANT to gamble even though they shouldn't. This should feel like a real degenerate gambler hyping someone up at a casino bar.",
    "the_scenario": "Brief description of what they're considering",
    "probability_analysis": {
        "win_probability": "X%",
        "lose_probability": "Y%", 
        "expected_value": "Mathematical EV calculation showing likely loss",
        "house_edge": "The casino's advantage percentage"
    },
    "gambler_pros": [
        "Overly optimistic 'pros' a gambler would say (3-4 items)"
    ],

    "scenarios": [
        {
            "outcome": "Best case",
            "probability": "X%",
            "result": "You win $Y",
            "larry_comment": "See?! This could be YOU! 🎰"
        },
        {
            "outcome": "Most likely",
            "probability": "X%", 
            "result": "You lose $Y",
            "larry_comment": "Just a small setback!"
        },
        {
            "outcome": "Worst case",
            "probability": "X%",
            "result": "You lose everything",
            "larry_comment": "Won't happen to you! 🍀"
        }
    ],
    "the_truth": "A sobering final statement",
    "gambling_helpline": "1-800-522-4700"
}

IMPORTANT: The lucky_larry_says field should be LONG and IMMERSIVE - really embody a degenerate gambler's mindset. Make it feel like talking to a real gambling addict who's hyping you up.

IMPORTANT: If there is prior conversation history, acknowledge and build upon it! Reference previous scenarios discussed, remember what the user asked before, and make your response feel like a continuation of the conversation. Lucky Larry remembers his buddies!"""

        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history:
                messages.append(msg)
        
        if image:
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": f"Analyze this gambling scenario: {scenario}"},
                    {"type": "image_url", "image_url": {"url": image}}
                ]
            })
        else:
            messages.append({"role": "user", "content": f"Analyze this gambling scenario: {scenario}"})
        
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


gambling_service = GamblingService()
