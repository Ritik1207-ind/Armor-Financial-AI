import os
import httpx
from app.utils.parser import normalize_numbers
from openai import AsyncOpenAI

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")

GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
HF_STT_MODEL = os.getenv("HF_INDIC_ASR_MODEL", "openai/whisper-large-v3")
STT_PROVIDER = os.getenv("STT_PROVIDER", "auto").lower()

async def transcribe_audio(audio_bytes: bytes) -> str:
    providers = {
        "openai": [_transcribe_with_openai],
        "huggingface": [_transcribe_with_huggingface],
        "groq": [_transcribe_with_groq],
        "auto": [_transcribe_with_openai, _transcribe_with_huggingface, _transcribe_with_groq],
    }

    for provider in providers.get(STT_PROVIDER, providers["auto"]):
        text = await provider(audio_bytes)
        if text:
            return _clean_stt(text)

    return ""


async def _transcribe_with_openai(audio_bytes: bytes) -> str:
    if not OPENAI_API_KEY:
        return ""

    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    transcript = await client.audio.transcriptions.create(
        model="whisper-1",
        file=("audio.wav", audio_bytes, "audio/wav"),
    )
    return getattr(transcript, "text", "") or ""


async def _transcribe_with_huggingface(audio_bytes: bytes) -> str:
    if not HF_API_TOKEN:
        return ""

    headers = {
        "Authorization": f"Bearer {HF_API_TOKEN}",
        "Content-Type": "audio/wav",
    }
    url = f"https://api-inference.huggingface.co/models/{HF_STT_MODEL}"

    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(url, content=audio_bytes, headers=headers)
        if res.status_code != 200:
            return ""
        payload = res.json()
        if isinstance(payload, dict):
            return payload.get("text", "")
        if isinstance(payload, list) and payload:
            first = payload[0]
            if isinstance(first, dict):
                return first.get("text", "")
    return ""


async def _transcribe_with_groq(audio_bytes: bytes) -> str:
    if not GROQ_API_KEY:
        return ""

    files = {"file": ("audio.wav", audio_bytes, "audio/wav")}
    data = {"model": "whisper-large-v3"}
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(GROQ_URL, files=files, data=data, headers=headers)
        if res.status_code == 200:
            return res.json().get("text", "")
    return ""

def _clean_stt(text: str) -> str:
    text = normalize_numbers(text)
    
    corrections = {
        " im ": " emi ",
        " s p ": " sip ",
        " e.m.i. ": " emi ",
        " s.i.p. ": " sip "
    }
    
    # Pad to ensure boundary matches
    text_padded = f" {text} "
    text_lower = text_padded.lower()
    for k, v in corrections.items():
        if k in text_lower:
            # simple replacement
            text_padded = text_padded.replace(k, v).replace(k.upper(), v.upper())
            text_lower = text_padded.lower()

    return text_padded.strip()
