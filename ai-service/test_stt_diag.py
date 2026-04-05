import asyncio
import os
import httpx
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

async def test_openai(audio_bytes):
    print("--- OpenAI ---")
    if not OPENAI_API_KEY: return "MISSING KEY"
    try:
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        transcript = await client.audio.transcriptions.create(
            model="whisper-1",
            file=("audio.webm", audio_bytes, "audio/webm"),
        )
        return getattr(transcript, "text", "")
    except Exception as e:
        return f"ERROR: {e}"

async def test_groq(audio_bytes):
    print("--- Groq ---")
    if not GROQ_API_KEY: return "MISSING KEY"
    try:
        GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
        files = {"file": ("audio.webm", audio_bytes, "audio/webm")}
        data = {"model": "whisper-large-v3"}
        headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(GROQ_URL, files=files, data=data, headers=headers)
            if res.status_code == 200:
                return res.json().get("text", "")
            else:
                return f"ERROR {res.status_code}: {res.text}"
    except Exception as e:
        return f"ERROR: {e}"

async def diagnostic():
    base_dir = r"c:\Users\siddh\Desktop\ELITE_BARBARIANS\Elite-Barbarians\uploads"
    test_file = os.path.join(base_dir, "audio_file-1775332233100-454440706.webm")
    
    if not os.path.exists(test_file):
        print(f"File NOT FOUND: {test_file}")
        return

    with open(test_file, "rb") as f:
        audio_bytes = f.read()

    print(f"Diagnostics for {test_file} ({len(audio_bytes)} bytes)")
    
    o_text = await test_openai(audio_bytes)
    print(f"OpenAI Result: '{o_text}'")
    
    g_text = await test_groq(audio_bytes)
    print(f"Groq Result: '{g_text}'")

if __name__ == "__main__":
    asyncio.run(diagnostic())
