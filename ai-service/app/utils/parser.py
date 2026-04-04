import json
import re
from typing import Optional

def normalize_numbers(text: str) -> str:
    """Normalize regional numbers: '10k' -> 10000, '15 hazaar' -> 15000"""
    text = str(text)
    patterns = [
        (r'(?<![\.\d])(\d+(?:\.\d+)?)\s*[kK]\b', 1000),
        (r'(?<![\.\d])(\d+(?:\.\d+)?)\s*(?:hazaar|hazar|thousand)\b', 1000),
        (r'(?<![\.\d])(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)\b', 100000),
        (r'(?<![\.\d])(\d+(?:\.\d+)?)\s*(?:crore|cr)\b', 10000000)
    ]
    for pattern, multiplier in patterns:
        def repl(m):
            return str(int(float(m.group(1)) * multiplier))
        text = re.sub(pattern, repl, text, flags=re.IGNORECASE)
    return text

def detect_language(text: str) -> str:
    text_lower = text.lower()
    
    hindi_kws = {'hai', 'kya', 'ho', 'jayega', 'ka', 'hain', 'hazaar', 'nahi',
                  'mujhe', 'chahiye', 'kitna', 'mera', 'meri', 'paisa', 'dena',
                  'lena', 'aur', 'bhai', 'yeh', 'woh', 'kaise', 'karein',
                  'rupaye', 'mahina', 'saal', 'lagega', 'milega', 'denge'}
    tamil_kws = {'edukkanuma', 'ah', 'irukku', 'enna', 'illa', 'puriyala', 'safe ah'}
    telugu_kws = {'undhi', 'emiti', 'cheppu', 'kavela', 'ledu'}
    kannada_kws = {'ide', 'beku', 'maadi', 'illa', 'gottilla'}
    
    words = set(re.findall(r'\b\w+\b', text_lower))
    
    hindi_match = bool(words & hindi_kws)
    tamil_match = bool(words & tamil_kws)
    telugu_match = bool(words & telugu_kws)
    kannada_match = bool(words & kannada_kws)
    
    has_english = bool(re.search(r'[a-zA-Z]', text))
    has_devanagari = bool(re.search(r'[\u0900-\u097F]', text))
    has_tamil = bool(re.search(r'[\u0B80-\u0BFF]', text))
    has_telugu = bool(re.search(r'[\u0C00-\u0C7F]', text))
    has_kannada = bool(re.search(r'[\u0C80-\u0CFF]', text))
    
    if has_english and (has_devanagari or has_tamil or has_telugu or has_kannada):
        return "mixed"
    if has_devanagari or (hindi_match and not has_english):
        return "hindi"
    if hindi_match and has_english:
        return "hinglish"
    if has_tamil or tamil_match:
        return "tamil"
    if has_telugu or telugu_match:
        return "telugu"
    if has_kannada or kannada_match:
        return "kannada"
        
    match_count = sum([hindi_match, tamil_match, telugu_match, kannada_match])
    if match_count > 1:
        return "mixed"
        
    return "english"

def extract_json(raw: str) -> dict:
    try:
        clean = raw.strip()
        if clean.startswith("```json"):
            clean = clean[7:]
        if clean.startswith("```"):
            clean = clean[3:]
        if clean.endswith("```"):
            clean = clean[:-3]
        return json.loads(clean.strip())
    except Exception:
        raise ValueError("Invalid JSON format")

def calculate_risk(emi: Optional[float], income: Optional[float], text: str) -> tuple[int, str]:
    score = 0
    level = "low"
    
    if emi and income and income > 0:
        ratio = emi / income
        if ratio > 0.40:
            score = 80
            level = "high"
        elif ratio >= 0.20:
            score = 50
            level = "medium"
        else:
            score = 20
            level = "low"
            
    text_lower = text.lower()
    uncertainty_words = [r"\bkya\b", r"\bsafe hai\b", r"\bshould we\b", r"\bsafe ah\b", r"\bpuriyala\b"]
    if any(re.search(pattern, text_lower) for pattern in uncertainty_words):
        score = min(score + 30, 100)
    
    if score >= 80:
        level = "high"
    elif score >= 50:
        level = "medium"
    else:
        level = "low"
        
    return score, level


def infer_estimated_income(entities: dict, text: str) -> Optional[int]:
    income_patterns = [
        r"(?:salary|income|earn|earning|monthly income)\D{0,30}\b(\d{4,9})\b",
        r"\b(\d{4,9})\b\D{0,30}(?:salary|income|per month|monthly)",
    ]

    for pattern in income_patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return int(match.group(1))

    emi = entities.get("emi") if entities else None
    if emi:
        return int(emi * 3)

    return None
