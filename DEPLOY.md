# 🚀 Deployment Guide

## Quick Deploy

### 1. Deploy Backend to Render (Free)

1. Go to [render.com](https://render.com) and sign up
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `OPENAI_API_KEY` = your OpenAI key
   - `MINIMAX_API_KEY` = your MiniMax key
   - `ALLOWED_ACCESS_CODES` = secret123,friend456 (optional, for access control)
6. Deploy! Copy the URL (e.g., `https://ai-study-api.onrender.com`)

### 2. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **Add New** → **Project**
3. Import your GitHub repo
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
5. Add Environment Variable:
   - `VITE_API_URL` = `https://your-render-url.onrender.com/api`
6. Deploy!

---

## 🔐 Access Control

### Option 1: Access Codes (Simple)

Set `ALLOWED_ACCESS_CODES` on your backend:
```
ALLOWED_ACCESS_CODES=code1,code2,code3
```

Share links with codes:
```
https://your-app.vercel.app?code=code1
```

### Option 2: Vercel Password Protection (Pro Plan)

1. Go to Vercel Dashboard → Project Settings → General
2. Enable "Password Protection"
3. Set a password

### Option 3: No Protection

Don't set `ALLOWED_ACCESS_CODES` - anyone can use it.

---

## 🔄 Update vercel.json

After deploying backend, update `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-RENDER-URL.onrender.com/api/:path*"
    }
  ]
}
```

---

## 📝 Environment Variables Summary

### Backend (Render)
| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `MINIMAX_API_KEY` | ❌ | MiniMax API for TTS |
| `HUME_API_KEY` | ❌ | Hume AI for TTS |
| `ALLOWED_ACCESS_CODES` | ❌ | Comma-separated access codes |

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API URL |

---

## 🎉 That's it!

Your app will be live at:
- Frontend: `https://your-project.vercel.app`
- Backend: `https://your-project.onrender.com`

Share with friends using: `https://your-project.vercel.app?code=their-code`
