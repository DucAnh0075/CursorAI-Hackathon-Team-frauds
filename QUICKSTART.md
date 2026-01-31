# Quick Start with Minimax/Manus API Keys

## Step 1: Create .env File

Create a `.env` file in the project root with your API keys:

```bash
# For Minimax (if you have this):
MINIMAX_API_KEY=your_minimax_key_here
MINIMAX_GROUP_ID=your_group_id  # Optional, add if required

# OR for Manus (if you have this):
MANUS_API_KEY=your_manus_key_here
```

**Note:** The system will automatically use Minimax if both are set (Minimax has priority).

## Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 3: Test It Out!

### Quick Test (Direct Question):
```bash
python main.py --input "Solve: x^2 + 5x + 6 = 0" --output test_video.mp4
```

### From Text File:
```bash
python main.py --input example_question.txt --output my_video.mp4
```

### Process All Questions:
```bash
python main.py --input example_question.txt --output all_questions.mp4 --all-questions
```

## What Happens?

1. The system detects your API key (Minimax/Manus)
2. Generates step-by-step educational content using AI
3. Creates narration audio
4. Generates visual slides
5. Combines everything into a video

## Expected Output

You'll see:
```
Using AI provider: MINIMAX  (or MANUS)
Step 1/5: Generating educational content...
Step 2/5: Creating narration script...
Step 3/5: Generating narration audio...
Step 4/5: Creating visual slides...
Step 5/5: Assembling video...
✅ Success! Video saved to: test_video.mp4
```

## Troubleshooting

**"No API key found"**
- Make sure your `.env` file is in the project root
- Check that the key name is exactly `MINIMAX_API_KEY` or `MANUS_API_KEY`
- No spaces around the `=` sign

**"Unexpected Minimax response format"**
- Check your API key is valid
- You may need to add `MINIMAX_GROUP_ID` to your `.env` file
- See `API_CONFIG.md` for more details

**"Manus API call failed"**
- The Manus endpoint may need adjustment
- Check Manus API documentation for the correct endpoint
- Update the URL in `content_generator.py` if needed

## Next Steps

- Customize slide colors in `visual_generator.py`
- Adjust narration speed in `narrator.py`
- Modify AI prompts in `content_generator.py`

Happy hacking! 🚀
