"""
AI Study Assistant - FastAPI Backend
Clean main entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.routers import chat, upload, health, video, explanation, reasoning, gambling, flashcard, slideshow

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI-powered study assistant API with Manus AI chat and MiniMax video generation"
)

# CORS middleware - allow all origins in production for Vercel
import os
cors_origins = settings.CORS_ORIGINS if settings.DEBUG else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(video.router, prefix="/api/video", tags=["Video"])
app.include_router(explanation.router, prefix="/api", tags=["Explanation"])
app.include_router(reasoning.router, prefix="/api", tags=["Reasoning"])
app.include_router(gambling.router, prefix="/api", tags=["Gambling"])
app.include_router(flashcard.router, prefix="/api", tags=["Flashcards"])
app.include_router(slideshow.router, prefix="/api", tags=["Slideshow"])
