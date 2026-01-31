# React + TypeScript Setup Guide

## Prerequisites

- **Node.js 18+** and npm
- Your Minimax or Manus API key

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_MINIMAX_API_KEY=your_minimax_key_here
VITE_MINIMAX_GROUP_ID=your_group_id  # Optional
```

**OR**

```env
VITE_MANUS_API_KEY=your_manus_key_here
```

**Important**: All environment variables must start with `VITE_` to be accessible in the browser.

### 3. Start Development Server

```bash
npm run dev
```

The app will automatically open at `http://localhost:3000`

### 4. Test Your API Key

Before generating videos, make sure your API key works. The app will show an error message if the API key is invalid.

## Project Structure

```
src/
├── components/          # React components
│   ├── FileUpload.tsx   # File upload & text input
│   ├── VideoGenerator.tsx  # Main video generation logic
│   └── SlideViewer.tsx     # Slide display component
├── services/           # Business logic
│   ├── api.ts         # AI API integration (Minimax/Manus)
│   ├── narrator.ts    # Text-to-speech service
│   └── videoGenerator.ts  # Video generation logic
├── App.tsx            # Main app component
└── main.tsx           # Entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features

✅ **File Upload** - Drag & drop PDFs or images
✅ **Text Input** - Type questions directly
✅ **AI Integration** - Supports Minimax, Manus, and OpenAI
✅ **Slide Generation** - Beautiful educational slides
✅ **Text-to-Speech** - Browser-based narration
✅ **Responsive Design** - Works on mobile and desktop

## Troubleshooting

### "No API key configured"
- Make sure `.env` file exists in project root
- Check that variable names start with `VITE_`
- Restart dev server after changing `.env`

### CORS Errors
- Some APIs may block browser requests
- For production, use a backend proxy
- Or configure CORS on the API side

### Module Not Found
- Run `npm install` again
- Delete `node_modules` and reinstall
- Check Node.js version (18+ required)

### Build Errors
- Check TypeScript errors: `npm run build`
- Fix any type errors in the code
- Make sure all imports are correct

## Next Steps

1. **Add PDF/Image Text Extraction**
   - Implement OCR using a library like Tesseract.js
   - Or use a backend service

2. **Enhance Video Export**
   - Use canvas API to render slides
   - Combine with audio for video file
   - Or use a backend service like FFmpeg

3. **Add More Features**
   - Multiple question support
   - Custom slide themes
   - Export options (PDF, video, etc.)

## Development Tips

- Use React DevTools for debugging
- Check browser console for API errors
- Test with simple questions first
- Use the network tab to debug API calls

Happy coding! 🚀
