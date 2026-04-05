import os
import httpx
import logging
from app.utils.parser import normalize_numbers
from openai import AsyncOpenAI

logger = logging.getLogger("armor.stt")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")

GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
HF_STT_MODEL = os.getenv("HF_INDIC_ASR_MODEL", "openai/whisper-large-v3")
STT_PROVIDER = os.getenv("STT_PROVIDER", "auto").lower()

HINGLISH_PROMPT = (
    "This is a conversation about Indian finance, banking, loans, EMI, SIP, investments, "
    "and salaries spoken in Hinglish (Hindi mixed with English). "
    "Transcribe using Latin/Roman script. Common terms: loan, EMI, SIP, lakh, crore, "
    "hazaar, rupees, bank, income, salary, interest rate, mutual fund, Nifty 50, "
    "RD, FD, recurring deposit, fixed deposit, post office, personal loan, home loan, "
    "HDFC, SBI, ICICI, HTSC, ten thousand, twenty thousand, fifty thousand, "
    "das hazaar, bees hazaar, pachaas hazaar, ek lakh, paanch lakh, "
    "percent, per annum, annual, monthly, yearly."
)

async def transcribe_audio(audio_bytes: bytes, filename: str = None) -> str:
    if filename and '.' in filename:
        ext = filename.split('.')[-1].lower()
        mime_mapping = {
            "mp3": "audio/mpeg",
            "m4a": "audio/m4a",
            "wav": "audio/wav",
            "ogg": "audio/ogg",
            "webm": "audio/webm",
            "flac": "audio/flac",
            "mp4": "audio/mp4"
        }
        mime_type = mime_mapping.get(ext, "audio/wav")
    else:
        is_webm = audio_bytes.startswith(b'\x1a\x45\xdf\xa3')
        mime_type = "audio/webm" if is_webm else "audio/wav"
        ext = "webm" if is_webm else "wav"

    logger.info(f"🎤 Transcribing {len(audio_bytes)} bytes (Format: {mime_type})")

    providers = {
        "openai": [_transcribe_with_openai],
        "huggingface": [_transcribe_with_huggingface],
        "groq": [_transcribe_with_groq],
        "auto": [_transcribe_with_groq, _transcribe_with_openai, _transcribe_with_huggingface],
    }

    for provider_func in providers.get(STT_PROVIDER, providers["auto"]):
        try:
            text = await provider_func(audio_bytes, mime_type, ext)
            if text and text.strip():
                logger.info(f"✅ STT Success: '{text[:50]}...'")
                return _clean_stt(text)
        except Exception as e:
            logger.error(f"❌ Provider {provider_func.__name__} failed: {e}")

    logger.warning("⚠️ All STT providers failed or returned empty text")
    return ""

async def _transcribe_with_openai(audio_bytes: bytes, mime_type: str, ext: str) -> str:
    if not OPENAI_API_KEY: return ""
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    transcript = await client.audio.transcriptions.create(
        model="whisper-1",
        language="en",
        prompt=HINGLISH_PROMPT,
        file=(f"audio.{ext}", audio_bytes, mime_type),
    )
    return getattr(transcript, "text", "") or ""

async def _transcribe_with_huggingface(audio_bytes: bytes, mime_type: str, ext: str) -> str:
    if not HF_API_TOKEN: return ""
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}", "Content-Type": mime_type}
    url = f"https://api-inference.huggingface.co/models/{HF_STT_MODEL}"
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(url, content=audio_bytes, headers=headers)
        if res.status_code != 200: return ""
        payload = res.json()
        if isinstance(payload, dict): return payload.get("text", "")
        if isinstance(payload, list) and payload:
            return payload[0].get("text", "") if isinstance(payload[0], dict) else ""
    return ""

async def _transcribe_with_groq(audio_bytes: bytes, mime_type: str, ext: str) -> str:
    if not GROQ_API_KEY: return ""
    files = {"file": (f"audio.{ext}", audio_bytes, mime_type)}
    data = {
        "model": "whisper-large-v3",
        "language": "en",
        "prompt": HINGLISH_PROMPT,
    }
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(GROQ_URL, files=files, data=data, headers=headers)
        if res.status_code == 200:
            return res.json().get("text", "")
        else:
            logger.error(f"Groq API Error ({res.status_code}): {res.text}")
    return ""

def _clean_stt(text: str) -> str:
    text = normalize_numbers(text).strip()

    # Whisper hallucination filters (often generated on silent or corrupted audio)
    lower_text = text.lower()
    hallucinations = [
        "none none none", "none.", "none", "you.", "thank you.", "thank you", "bye.", "subscribe.", "watch."
    ]
    if lower_text in hallucinations or "none none" in lower_text or len(lower_text) < 2:
        return ""

    corrections = {
        " im ": " emi ",
        " s p ": " sip ",
        " e.m.i. ": " emi ",
        " s.i.p. ": " sip "
    }

    text_padded = f" {text} "
    text_lower = text_padded.lower()
    for k, v in corrections.items():
        if k in text_lower:
            text_padded = text_padded.replace(k, v).replace(k.upper(), v.upper())
            text_lower = text_padded.lower()

    return text_padded.strip()


    
