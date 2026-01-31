# AI Study Video Generator

A modern React + TypeScript web application that generates educational study videos from exercise sheets or example questions, similar to organic chemistry teacher videos.

## 🚀 Features

- 📝 Upload PDFs, images, or type questions directly
- 🤖 AI-powered step-by-step explanations (Minimax, Manus, or OpenAI)
- 🎨 Beautiful slide-based visual presentation
- 🎙️ Text-to-speech narration (browser-based)
- 🎬 Interactive video preview
- 💻 Modern, responsive UI

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Axios** - HTTP client
- **React Dropzone** - File uploads

## 📦 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Create a `.env` file in the root directory:

```env
# Use one of these:
VITE_MINIMAX_API_KEY=your_minimax_key_here
VITE_MINIMAX_GROUP_ID=your_group_id  # Optional

# OR
VITE_MANUS_API_KEY=your_manus_key_here

# OR
VITE_OPENAI_API_KEY=your_openai_key_here
```

### 3. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

## 📖 Usage

1. **Enter a question** in the text area, or
2. **Upload a PDF/image** by dragging and dropping
3. Click "Generate Video"
4. Browse through the generated slides
5. Use "Play Narration" to hear the explanation

## 🎯 Project Structure

```
├── src/
│   ├── components/       # React components
│   │   ├── FileUpload.tsx
│   │   ├── VideoGenerator.tsx
│   │   └── SlideViewer.tsx
│   ├── services/         # Business logic
│   │   ├── api.ts        # AI API integration
│   │   ├── narrator.ts   # Text-to-speech
│   │   └── videoGenerator.ts
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── index.html
├── package.json
└── vite.config.ts
```

## 🔧 Configuration

### API Providers

The app automatically detects which API key you've configured:
- **Priority**: Minimax → Manus → OpenAI

### Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the browser.

## 🐛 Troubleshooting

### "No API key configured"
- Make sure your `.env` file exists and contains a valid API key
- Restart the dev server after changing `.env`

### CORS Errors
- Some APIs may require a backend proxy
- Consider using a backend service for production

### File Upload Issues
- PDF/image text extraction is currently a placeholder
- For production, implement OCR or use a backend service

## 📝 Development Notes

- The app runs entirely in the browser
- For production, consider adding a backend for:
  - PDF/image text extraction
  - Audio file generation
  - Video rendering

## 🎨 Customization

- Modify colors in `App.css` and component CSS files
- Adjust slide layouts in `SlideViewer.tsx`
- Customize AI prompts in `services/api.ts`

## 📄 License

Built for Hackathon 2024
