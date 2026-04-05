import os
import logging
import httpx
from app.utils.prompt import SYSTEM_PROMPT, PARSER_PROMPT
from app.utils.parser import extract_json

logger = logging.getLogger("armor.llm")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
URL = "https://api.groq.com/openai/v1/chat/completions"

async def call_llm(prompt: str, is_retry: bool = False) -> dict:
    sys_content = PARSER_PROMPT if is_retry else SYSTEM_PROMPT
    user_content = f"Input text: {prompt}"

    payload = {
        "model": "llama-3.1-8b-instant" if is_retry else "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": sys_content},
            {"role": "user", "content": user_content}
        ],
        "temperature": 0.0,
        "response_format": {"type": "json_object"}
    }
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(URL, json=payload, headers=headers)
        
    if res.status_code == 200:
        return extract_json(res.json()["choices"][0]["message"]["content"])
    logger.error(f"LLM Call Failed ({res.status_code}): {res.text[:200]}")
    raise Exception(f"LLM Call Failed: HTTP {res.status_code}")

async def analyze_text(text: str) -> dict:
    if not GROQ_API_KEY:
        return {}

    last_err = None
    # 2 attempts total (1 retry) to stay within backend timeout budget
    for attempt in range(2):
        try:
            return await call_llm(prompt=text, is_retry=(attempt > 0))
        except Exception as e:
            last_err = e
            logger.warning(f"LLM attempt {attempt + 1} failed: {e}")

    logger.error(f"All LLM attempts failed. Last error: {last_err}")
    return {}
