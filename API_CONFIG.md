# API Configuration Guide

This project supports multiple AI providers for content generation. The system automatically detects which API key you have configured.

## Supported Providers

### 1. Minimax (Recommended if available)
Minimax is a Chinese AI provider with good performance for educational content.

**Setup:**
```bash
MINIMAX_API_KEY=your_minimax_api_key_here
MINIMAX_GROUP_ID=your_group_id  # Optional, but may be required
```

**API Endpoint:** `https://api.minimax.chat/v1/text/chatcompletion_pro`
**Model:** `abab6.5s-chat`

### 2. Manus
Manus is an alternative AI provider.

**Setup:**
```bash
MANUS_API_KEY=your_manus_api_key_here
```

**Note:** The Manus API endpoint and model name may need to be adjusted based on their actual API documentation. If you encounter errors, check the Manus API docs and update the endpoint in `content_generator.py`.

### 3. OpenAI (Fallback)
OpenAI GPT models as a fallback option.

**Setup:**
```bash
OPENAI_API_KEY=sk-your-openai-key-here
```

**Model:** `gpt-4o-mini` (cost-efficient for hackathon)

## Priority Order

The system checks for API keys in this order:
1. **Minimax** (if `MINIMAX_API_KEY` is set)
2. **Manus** (if `MANUS_API_KEY` is set)
3. **OpenAI** (if `OPENAI_API_KEY` is set)

## Testing Your API Key

To test if your API key works, you can run:
```bash
python main.py --input "Test question: What is 2+2?" --output test.mp4
```

If you see "Using AI provider: MINIMAX" (or MANUS/OPENAI), your key is working!

## Troubleshooting

### Minimax API Issues
- Make sure you have a valid API key from Minimax
- Some Minimax accounts require a `group_id` - add it to your `.env` file
- Check Minimax API documentation for any recent changes

### Manus API Issues
- Verify the API endpoint URL in `content_generator.py` matches Manus documentation
- Check if the model name needs to be updated
- Ensure your API key format is correct

### General Issues
- Make sure only ONE API key is set (or the system will use the first one found)
- Check that your `.env` file is in the project root directory
- Verify the API key doesn't have extra spaces or quotes
