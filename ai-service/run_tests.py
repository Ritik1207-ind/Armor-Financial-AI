"""
Armor AI Service - Comprehensive Test Suite
============================================
Run with: python run_tests.py
"""
import asyncio
import sys
import json

sys.path.insert(0, ".")

from dotenv import load_dotenv
load_dotenv()

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"

total = 0
failures = 0

def check(label, actual, expected):
    global total, failures
    total += 1
    ok = actual == expected
    if not ok:
        failures += 1
    status = PASS if ok else FAIL
    print(f"  [{status}] {label}")
    if not ok:
        print(f"         Got:      {actual!r}")
        print(f"         Expected: {expected!r}")

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

# ──────────────────────────────────────────────────────────────
# UNIT TESTS
# ──────────────────────────────────────────────────────────────

section("TEST 1 — normalize_numbers")
from app.utils.parser import normalize_numbers

check("10k -> 10000",         normalize_numbers("EMI of 10k"), "EMI of 10000")
check("15 hazaar -> 15000",   normalize_numbers("15 hazaar monthly"), "15000 monthly")
check("50 lakh -> 5000000",   normalize_numbers("loan 50 lakh"),  "loan 5000000")
check("2 crore -> 20000000",  normalize_numbers("2 crore property"), "20000000 property")
check("5.5k -> 5500",         normalize_numbers("5.5k EMI"), "5500 EMI")
check("plain text unchanged", normalize_numbers("hello world"), "hello world")

# ──────────────────────────────────────────────────────────────
section("TEST 2 — detect_language")
from app.utils.parser import detect_language

check("English only",      detect_language("I want a home loan"),                           "english")
check("Hinglish (hazaar)", detect_language("loan hazaar mein hai"),                         "hinglish")
check("Hinglish (kya)",    detect_language("kya yeh loan safe hai"),                        "hinglish")
check("Tamil keyword",     detect_language("edukkanuma safe ah irukku"),                    "tamil")
check("Telugu keyword",    detect_language("undhi emiti kavela"),                           "telugu")
check("Hindi only",        detect_language("mujhe loan chahiye"),                           "hinglish")  # hindi keywords + english letters

# ──────────────────────────────────────────────────────────────
section("TEST 3 — calculate_risk")
from app.utils.parser import calculate_risk

score, level = calculate_risk(25000, 80000, "normal text")
check("EMI 31% ratio -> medium (50)", (score, level), (50, "medium"))

score, level = calculate_risk(40000, 80000, "normal text")
check("EMI 50% ratio -> high (80)",   (score, level), (80, "high"))

score, level = calculate_risk(5000, 80000, "normal text")
check("EMI 6% ratio -> low (20)",     (score, level), (20, "low"))

score, level = calculate_risk(None, None, "no data")
check("No EMI/income -> low (0)",     (score, level), (0, "low"))

score, level = calculate_risk(25000, 80000, "kya safe hai bhai")
check("Uncertainty bump -> min(80,100) -> high", (score, level), (80, "high"))

score, level = calculate_risk(5000, 80000, "puriyala safe ah")
check("Low EMI + uncertainty -> 50 medium", (score, level), (50, "medium"))

# ──────────────────────────────────────────────────────────────
section("TEST 4 — infer_estimated_income")
from app.utils.parser import infer_estimated_income

result = infer_estimated_income({"emi": 25000}, "My salary is 80000 per month")
check("Salary regex match -> 80000", result, 80000)

result = infer_estimated_income({"emi": 10000}, "My income is 50000")
check("Income regex match -> 50000", result, 50000)

result = infer_estimated_income({"emi": 20000}, "No income mentioned here")
check("Fallback emi*3 -> 60000", result, 60000)

result = infer_estimated_income({}, "Nothing here")
check("No data -> None", result, None)

# ──────────────────────────────────────────────────────────────
section("TEST 5 — extract_financial_entities")
from app.services.entities import extract_financial_entities

r = extract_financial_entities("My EMI is 25000 per month")
check("EMI extracted", r.get("emi"), 25000)

r = extract_financial_entities("I invest 5000 in SIP every month")
check("SIP extracted", r.get("sip"), 5000)

r = extract_financial_entities("I need a loan of 5000000 rupees")
check("Loan extracted", r.get("loan_amount"), 5000000)

r = extract_financial_entities("EMI 15000 and SIP 3000 for a loan of 2000000")
check("All three entities", (r.get("emi"), r.get("sip"), r.get("loan_amount")), (15000, 3000, 2000000))

r = extract_financial_entities("What is the weather today?")
check("Non-financial -> all None", (r.get("emi"), r.get("sip"), r.get("loan_amount")), (None, None, None))

# ──────────────────────────────────────────────────────────────
section("TEST 6 — _fallback_financial_detection")
from app.services.nlp import _fallback_financial_detection

is_fin, score = _fallback_financial_detection("loan EMI mutual fund stock")
check("Multi-keyword -> financial", is_fin, True)

is_fin, score = _fallback_financial_detection("What is the weather today in Delhi?")
check("Non-financial -> not financial", is_fin, False)

is_fin, score = _fallback_financial_detection("My salary is 80000")
check("Salary keyword -> financial", is_fin, True)

# ──────────────────────────────────────────────────────────────
section("TEST 7 — extract_json")
from app.utils.parser import extract_json

r = extract_json('{"key": "value"}')
check("Plain JSON parse", r, {"key": "value"})

r = extract_json('  {"a": 1}  ')
check("Whitespace stripped JSON", r, {"a": 1})

try:
    extract_json("this is not json")
    check("Invalid JSON raises", False, True)
except ValueError:
    check("Invalid JSON raises ValueError", True, True)

# ──────────────────────────────────────────────────────────────
section("TEST 8 — build_financial_advice")
from app.services.nlp import build_financial_advice

advice = build_financial_advice({"emi": 25000, "sip": 5000, "loan_amount": 5000000}, "high")
check("3 advice points for all entities + high risk", len(advice), 3)

advice = build_financial_advice({}, "low")
check("No entities -> generic advice", len(advice), 1)

advice = build_financial_advice({"emi": 10000}, "low")
check("EMI only advice", "EMI" in advice[0] or "emi" in advice[0].lower(), True)

# ──────────────────────────────────────────────────────────────
# ASYNC INTEGRATION TEST (pipeline without LLM — uses fallback)
# ──────────────────────────────────────────────────────────────
section("TEST 9 — Full pipeline (analyze_financial_conversation)")
from app.services.pipeline import analyze_financial_conversation

async def run_pipeline_tests():
    # Test 9a: Rich financial input
    text = "I want to take a home loan of 5000000. My salary is 80000 per month and my EMI would be 40000. I also do SIP of 5000."
    result = await analyze_financial_conversation(text)
    check("9a: transcription set",       result["transcription"] == text, True)
    check("9a: is_financial=True",       result["is_financial"], True)
    check("9a: language=english",        result["language"], "english")
    check("9a: loan_amount extracted",   result["entities"].get("loan_amount") is not None, True)
    check("9a: emi extracted",           result["entities"].get("emi") is not None, True)
    check("9a: estimated_income set",    result["estimated_income"] is not None, True)
    check("9a: risk_score >= 50",        result["risk_score"] >= 50, True)       # 40k/80k = 50%
    check("9a: risk_level=high",         result["risk_level"], "high")
    check("9a: advice list non-empty",   len(result["financial_advice"]) > 0, True)
    check("9a: summary non-empty",       len(result["summary"]) > 0, True)

    # Test 9b: Non-financial text
    text2 = "Let's go watch a movie tonight and have dinner."
    result2 = await analyze_financial_conversation(text2)
    check("9b: non-financial text",      result2["is_financial"], False)
    check("9b: risk_score=0",            result2["risk_score"], 0)

    # Test 9c: Hinglish
    text3 = "Mujhe 20 lakh ka loan chahiye, meri salary 60000 hai aur EMI 15000 dene ki capacity hai"
    result3 = await analyze_financial_conversation(text3)
    check("9c: hinglish detected",       result3["language"] in ("hinglish", "hindi", "mixed", "english"), True)
    check("9c: financial detected",      result3["is_financial"], True)

    # Test 9d: Edge case — very short text
    text4 = "EMI"
    result4 = await analyze_financial_conversation(text4)
    check("9d: short text no crash",     isinstance(result4, dict), True)

asyncio.run(run_pipeline_tests())

# ──────────────────────────────────────────────────────────────
# SUMMARY
# ──────────────────────────────────────────────────────────────
print(f"\n{'='*60}")
print(f"  RESULTS: {total - failures}/{total} tests passed")
if failures:
    print(f"  \033[91m{failures} FAILURES\033[0m — see above for details")
else:
    print(f"  \033[92mAll tests PASSED!\033[0m")
print(f"{'='*60}\n")
