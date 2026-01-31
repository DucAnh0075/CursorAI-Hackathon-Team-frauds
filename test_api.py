#!/usr/bin/env python3
"""Test script to verify API keys are working."""

import os
import sys

# Try to load dotenv, but don't fail if it's not installed
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # Simple .env parser fallback
    env_file = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()


def test_minimax():
    """Test Minimax API."""
    api_key = os.getenv('MINIMAX_API_KEY')
    group_id = os.getenv('MINIMAX_GROUP_ID', '')
    
    if not api_key:
        return False, "MINIMAX_API_KEY not found in .env file"
    
    try:
        import requests
        
        url = "https://api.minimax.chat/v1/text/chatcompletion_pro"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "abab6.5s-chat",
            "messages": [
                {
                    "role": "user",
                    "content": "Say 'Hello, API test successful!' if you can read this."
                }
            ],
            "temperature": 0.7,
            "max_tokens": 100
        }
        
        if group_id:
            payload["group_id"] = group_id
        
        print("Testing Minimax API...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 401:
            # Try alternative auth format
            print("Bearer auth failed, trying alternative format...")
            headers_alt = {
                "api-key": api_key,
                "Content-Type": "application/json"
            }
            response = requests.post(url, json=payload, headers=headers_alt, timeout=30)
        
        response.raise_for_status()
        result = response.json()
        
        # Extract response text
        if "choices" in result and len(result["choices"]) > 0:
            content = result["choices"][0].get("message", {}).get("content", "") or result["choices"][0].get("text", "")
        elif "reply" in result:
            content = result["reply"]
        elif "content" in result:
            content = result["content"]
        else:
            return False, f"Unexpected response format: {list(result.keys())}"
        
        return True, f"✅ Minimax API working! Response: {content[:100]}"
        
    except requests.exceptions.HTTPError as e:
        return False, f"❌ HTTP Error: {e.response.status_code} - {e.response.text[:200]}"
    except Exception as e:
        return False, f"❌ Error: {str(e)}"


def test_manus():
    """Test Manus API."""
    api_key = os.getenv('MANUS_API_KEY')
    
    if not api_key:
        return False, "MANUS_API_KEY not found in .env file"
    
    try:
        import requests
        
        url = "https://api.manus.ai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "manus-chat",
            "messages": [
                {
                    "role": "user",
                    "content": "Say 'Hello, API test successful!' if you can read this."
                }
            ],
            "temperature": 0.7,
            "max_tokens": 100
        }
        
        print("Testing Manus API...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        result = response.json()
        
        # Extract response text
        if "choices" in result and len(result["choices"]) > 0:
            content = result["choices"][0].get("message", {}).get("content", "")
        elif "content" in result:
            content = result["content"]
        elif "text" in result:
            content = result["text"]
        else:
            return False, f"Unexpected response format: {list(result.keys())}"
        
        return True, f"✅ Manus API working! Response: {content[:100]}"
        
    except requests.exceptions.HTTPError as e:
        return False, f"❌ HTTP Error: {e.response.status_code} - {e.response.text[:200]}"
    except Exception as e:
        return False, f"❌ Error: {str(e)}"


def test_openai():
    """Test OpenAI API."""
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        return False, "OPENAI_API_KEY not found in .env file"
    
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=api_key)
        
        print("Testing OpenAI API...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": "Say 'Hello, API test successful!' if you can read this."}
            ],
            max_tokens=100
        )
        
        content = response.choices[0].message.content
        return True, f"✅ OpenAI API working! Response: {content[:100]}"
        
    except ImportError:
        return False, "❌ OpenAI package not installed. Run: pip install openai"
    except Exception as e:
        return False, f"❌ Error: {str(e)}"


def main():
    """Test all available API keys."""
    print("=" * 60)
    print("API Key Test Script")
    print("=" * 60)
    print()
    
    # Check which keys are available
    minimax_key = os.getenv('MINIMAX_API_KEY')
    manus_key = os.getenv('MANUS_API_KEY')
    openai_key = os.getenv('OPENAI_API_KEY')
    
    print("Checking for API keys in .env file...")
    print(f"  MINIMAX_API_KEY: {'✅ Found' if minimax_key else '❌ Not found'}")
    print(f"  MANUS_API_KEY: {'✅ Found' if manus_key else '❌ Not found'}")
    print(f"  OPENAI_API_KEY: {'✅ Found' if openai_key else '❌ Not found'}")
    print()
    
    if not any([minimax_key, manus_key, openai_key]):
        print("❌ No API keys found in .env file!")
        print()
        print("Please add your API key(s) to the .env file:")
        print("  MINIMAX_API_KEY=your_key_here")
        print("  MANUS_API_KEY=your_key_here")
        print("  OPENAI_API_KEY=your_key_here")
        print()
        print("Example .env file:")
        print("  MINIMAX_API_KEY=sk-xxxxxxxxxxxxx")
        sys.exit(1)
    
    print("=" * 60)
    print()
    
    # Test in priority order
    if minimax_key:
        success, message = test_minimax()
        print(f"Minimax: {message}")
        print()
        if success:
            print("✅ Your Minimax API key is working!")
            return 0
    
    if manus_key:
        success, message = test_manus()
        print(f"Manus: {message}")
        print()
        if success:
            print("✅ Your Manus API key is working!")
            return 0
    
    if openai_key:
        success, message = test_openai()
        print(f"OpenAI: {message}")
        print()
        if success:
            print("✅ Your OpenAI API key is working!")
            return 0
    
    print("❌ None of the API keys are working. Please check your keys and try again.")
    return 1


if __name__ == '__main__':
    sys.exit(main())
