# Setup Instructions

## Prerequisites

1. **Python 3.8+** - Make sure Python is installed
2. **FFmpeg** - Required for video processing
   - Ubuntu/Debian: `sudo apt-get install ffmpeg`
   - macOS: `brew install ffmpeg`
   - Windows: Download from https://ffmpeg.org/
3. **Tesseract OCR** - For extracting text from images/PDFs
   - Ubuntu/Debian: `sudo apt-get install tesseract-ocr`
   - macOS: `brew install tesseract`
   - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki

## Installation

1. **Clone or navigate to the project directory**

2. **Create a virtual environment (recommended):**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Add your API key (use one of these):
   ```
   # For Minimax (recommended if available):
   MINIMAX_API_KEY=your_minimax_key_here
   MINIMAX_GROUP_ID=your_group_id  # Optional
   
   # For Manus:
   MANUS_API_KEY=your_manus_key_here
   
   # For OpenAI (fallback):
   OPENAI_API_KEY=sk-your-key-here
   ```
   - The system will automatically detect which API key you've set

## Quick Test

Test with a simple question:
```bash
python main.py --input "Solve: x^2 + 5x + 6 = 0" --output test_video.mp4
```

Or use the example file:
```bash
python main.py --input example_question.txt --output example_video.mp4
```

## Troubleshooting

### "No API key found"
- Make sure you created a `.env` file with at least one API key:
  - `MINIMAX_API_KEY=your_key`
  - `MANUS_API_KEY=your_key`
  - `OPENAI_API_KEY=your_key`
- The system will use whichever key is available (priority: Minimax > Manus > OpenAI)

### "FFmpeg not found"
- Install FFmpeg using the commands above
- Make sure it's in your system PATH

### "Tesseract not found"
- Install Tesseract OCR
- On some systems, you may need to specify the path in code

### Video generation is slow
- This is normal! Generating AI content and TTS takes time
- First video may take 2-5 minutes depending on question complexity

### Audio issues
- Make sure you have internet connection (gTTS requires it)
- Check that port 443 is not blocked
