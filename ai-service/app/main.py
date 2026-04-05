"""
Armor AI Service - Main Application
=====================================
FastAPI app entry point with CORS, health check, and route registration.
Run with: uvicorn app.main:app --reload --port 8000
"""

import os
import sys
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager

# ─── Load Environment FIRST (before any app imports that read env vars) ────────
from dotenv import load_dotenv
load_dotenv()

# Ensure the 'app' package is discoverable
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.predict import router as predict_router

# ─── Logging Configuration ────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(name)-18s │ %(levelname)-5s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("armor.main")


# ─── Lifespan (Startup / Shutdown) ────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # ── Startup ────────────────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("🛡️  ARMOR FINANCIAL AI SERVICE")
    logger.info("=" * 60)
    logger.info(f"📅 Started at: {datetime.now(timezone.utc).isoformat()}")
    logger.info(f"🔗 Port: {os.getenv('PORT', 8000)}")
    
    # Check API keys
    groq_ok = bool(os.getenv("GROQ_API_KEY")) and os.getenv("GROQ_API_KEY") != "your_groq_api_key_here"
    openai_ok = bool(os.getenv("OPENAI_API_KEY")) and os.getenv("OPENAI_API_KEY") != "your_openai_api_key_here"
    hf_ok = bool(os.getenv("HF_API_TOKEN")) and os.getenv("HF_API_TOKEN") != "your_hf_api_token_here"
    gemini_ok = bool(os.getenv("GEMINI_API_KEY")) and os.getenv("GEMINI_API_KEY") != "your_gemini_api_key_here"
    deepgram_ok = bool(os.getenv("DEEPGRAM_API_KEY")) and os.getenv("DEEPGRAM_API_KEY") != "your_deepgram_api_key_here"
    
    logger.info(f"🔑 Groq API Key:    {'✅ Configured' if groq_ok else '❌ Missing'}")
    logger.info(f"🔑 OpenAI API Key:  {'✅ Configured' if openai_ok else '❌ Missing'}")
    logger.info(f"🔑 HF API Token:    {'✅ Configured' if hf_ok else '❌ Missing'}")
    logger.info(f"🔑 Gemini API Key:  {'✅ Configured' if gemini_ok else '❌ Missing'}")
    logger.info(f"🔑 Deepgram API Key:{'✅ Configured' if deepgram_ok else '❌ Missing'}")
    
    if not groq_ok and not openai_ok and not hf_ok and not gemini_ok:
        logger.warning("⚠️  No LLM provider configured! Analysis will return fallback responses.")
    
    logger.info("=" * 60)
    logger.info("🚀 AI Service is READY")
    logger.info("=" * 60)
    
    yield
    
    # ── Shutdown ───────────────────────────────────────────────────────────
    logger.info("🛑 Armor AI Service shutting down...")


# ─── FastAPI App ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Armor Financial AI Service",
    description=(
        "AI-powered multilingual financial conversation intelligence system. "
        "Transcribes speech, detects financial intent, extracts entities, "
        "and generates structured financial insights."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ─── CORS Middleware ───────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Allow all origins (dev mode)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health Check ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and backend connectivity."""
    groq_ok = bool(os.getenv("GROQ_API_KEY")) and os.getenv("GROQ_API_KEY") != "your_groq_api_key_here"
    openai_ok = bool(os.getenv("OPENAI_API_KEY")) and os.getenv("OPENAI_API_KEY") != "your_openai_api_key_here"
    hf_ok = bool(os.getenv("HF_API_TOKEN")) and os.getenv("HF_API_TOKEN") != "your_hf_api_token_here"
    gemini_ok = bool(os.getenv("GEMINI_API_KEY")) and os.getenv("GEMINI_API_KEY") != "your_gemini_api_key_here"
    deepgram_ok = bool(os.getenv("DEEPGRAM_API_KEY")) and os.getenv("DEEPGRAM_API_KEY") != "your_deepgram_api_key_here"
    
    return {
        "status": "healthy",
        "service": "armor-ai-service",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "providers": {
            "groq": "configured" if groq_ok else "missing",
            "openai": "configured" if openai_ok else "missing",
            "huggingface": "configured" if hf_ok else "missing",
            "gemini": "configured" if gemini_ok else "missing",
            "deepgram": "configured" if deepgram_ok else "missing",
        },
    }


# ─── Root Endpoint ─────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    """Root endpoint — basic service info."""
    return {
        "service": "Armor Financial AI Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "predict": "POST /predict",
    }


# ─── Register Routes ──────────────────────────────────────────────────────────

app.include_router(predict_router, tags=["Prediction"])

logger.info("📌 Routes registered: /predict, /health, /docs")
