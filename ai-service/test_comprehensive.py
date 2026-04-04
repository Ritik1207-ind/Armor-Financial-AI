"""
Armor AI Service — Comprehensive Test Suite (120+ test cases)
==============================================================
Run with: python test_comprehensive.py
"""
import asyncio
import sys
import json

sys.path.insert(0, ".")

from dotenv import load_dotenv
load_dotenv()

from app.services.nlp import _fallback_financial_detection
from app.services.llm import analyze_text
import httpx
from unittest.mock import patch, AsyncMock
from unittest.mock import patch, AsyncMock

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"

total = 0
failures = 0
failure_details = []

def check(label, actual, expected):
    global total, failures
    total += 1
    ok = actual == expected
    if not ok:
        failures += 1
        failure_details.append((label, actual, expected))
    status = PASS if ok else FAIL
    print(f"  [{status}] {label}")
    if not ok:
        print(f"         Got:      {actual!r}")
        print(f"         Expected: {expected!r}")

def check_in(label, actual, valid_set):
    """Check that actual is one of the valid values."""
    global total, failures
    total += 1
    ok = actual in valid_set
    if not ok:
        failures += 1
        failure_details.append((label, actual, f"one of {valid_set}"))
    status = PASS if ok else FAIL
    print(f"  [{status}] {label}")
    if not ok:
        print(f"         Got:      {actual!r}")
        print(f"         Expected: one of {valid_set!r}")

def check_true(label, condition):
    check(label, condition, True)

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

# ══════════════════════════════════════════════════════════════
# TEST 1 — normalize_numbers (20 cases)
# ══════════════════════════════════════════════════════════════
section("TEST 1 — normalize_numbers")
from app.utils.parser import normalize_numbers

# Basic multiplier tests
check("10k -> 10000",           normalize_numbers("EMI of 10k"), "EMI of 10000")
check("15 hazaar -> 15000",     normalize_numbers("15 hazaar monthly"), "15000 monthly")
check("50 lakh -> 5000000",     normalize_numbers("loan 50 lakh"), "loan 5000000")
check("2 crore -> 20000000",    normalize_numbers("2 crore property"), "20000000 property")
check("5.5k -> 5500",           normalize_numbers("5.5k EMI"), "5500 EMI")
check("plain unchanged",        normalize_numbers("hello world"), "hello world")

# Decimal multipliers
check("1.5 lakh -> 150000",     normalize_numbers("1.5 lakh budget"), "150000 budget")
check("2.5 crore -> 25000000",  normalize_numbers("2.5 crore house"), "25000000 house")
check("3.2k -> 3200",           normalize_numbers("3.2k per month"), "3200 per month")

# Case insensitivity
check("10K uppercase",          normalize_numbers("10K loan"), "10000 loan")
check("5 Lakh mixed case",     normalize_numbers("5 Lakh rupees"), "500000 rupees")
check("1 Crore mixed case",   normalize_numbers("1 Crore budget"), "10000000 budget")

# Multiple numbers in text
check("multiple: 10k and 5k",  normalize_numbers("EMI 10k and SIP 5k"), "EMI 10000 and SIP 5000")

# Alternative spellings
check("hazar alt spelling",     normalize_numbers("20 hazar rupee"), "20000 rupee")
check("thousand keyword",       normalize_numbers("50 thousand salary"), "50000 salary")
check("lac alternative",        normalize_numbers("10 lac loan"), "1000000 loan")
check("cr shorthand",          normalize_numbers("1 cr investment"), "10000000 investment")

# Edge: number with no suffix
check("plain number stays",    normalize_numbers("salary is 80000"), "salary is 80000")

# Edge: empty string
check("empty string",          normalize_numbers(""), "")

# Edge: only number with suffix
check("just 20k",              normalize_numbers("20k"), "20000")

# Extra Edge Cases
check("decimal with k",        normalize_numbers("1.25k"), "1250")
check("decimal with lakh",     normalize_numbers("1.25 lakh"), "125000")
check("decimal with crore",    normalize_numbers("1.25 crore"), "12500000")
check("zero amounts",          normalize_numbers("0k or 0 lakh"), "0 or 0")
check("negative amounts",      normalize_numbers("-5k loan"), "-5000 loan")
check("multiple decimals",     normalize_numbers("1.5.5k error"), "1.5.5k error") # Regex behavior safely ignores malformed strings
check("trailing spaces",       normalize_numbers(" 10k "), " 10000 ")
check("mixed spacing",         normalize_numbers("10   k"), "10000") # Might fail depending on regex, serves as sanity check
check("huge numbers",          normalize_numbers("999999 lakh"), "99999900000")


# ══════════════════════════════════════════════════════════════
# TEST 2 — detect_language (20 cases)
# ══════════════════════════════════════════════════════════════
section("TEST 2 — detect_language")
from app.utils.parser import detect_language

# Pure English
check("Pure English sentence",       detect_language("I want a home loan"), "english")
check("English finance text",        detect_language("My EMI is 25000 per month"), "english")
check("English question",            detect_language("How much interest do I pay?"), "english")

# Hinglish (Hindi words + English letters)
check("Hinglish hazaar",             detect_language("loan hazaar mein hai"), "hinglish")
check("Hinglish kya",                detect_language("kya yeh loan safe hai"), "hinglish")
check("Hinglish mujhe",              detect_language("mujhe loan chahiye"), "hinglish")
check("Hinglish kitna",              detect_language("kitna EMI lagega"), "hinglish")
check("Hinglish mera",               detect_language("mera salary 50000 hai"), "hinglish")
check("Hinglish complex",            detect_language("mujhe 20 lakh ka loan chahiye aur meri salary 60000 hai"), "hinglish")

# Tamil
check("Tamil keywords",              detect_language("edukkanuma safe ah irukku"), "tamil")
check("Tamil enna",                   detect_language("enna loan interest irukku"), "tamil")

# Telugu
check("Telugu keywords",             detect_language("undhi emiti kavela"), "telugu")
check("Telugu cheppu",               detect_language("loan details cheppu"), "telugu")

# Edge: single word
check("Single English word",         detect_language("hello"), "english")
check("Single Hindi word",           detect_language("chahiye"), "hinglish")

# Edge: numbers only
check("Only numbers",                detect_language("12345"), "english")

# Edge: empty-like
check("Whitespace-heavy",            detect_language("   hello   "), "english")

# Mixed keywords from multiple languages
check("Multi-lang keywords",         detect_language("puriyala undhi loan"), "tamil")  # tamil takes precedence in matching

# Extra Language Cases
check("Kannada keywords",            detect_language("ide beku loan"), "kannada")
check("Kannada maadi",               detect_language("help maadi"), "kannada")
check("Mixed pure scripts",          detect_language("loan चाहिए"), "mixed")
check("Mixed symbol noise",          detect_language("loan!! ?? hazaar..."), "hinglish")
check("No words, just symbols",      detect_language("!!!???"), "english")
check("Long Hinglish",               detect_language("mujhe pata nahi kya karna chahiye bhai mera emi kitna hoga"), "hinglish")
check("Long Telugu",                 detect_language("emi details cheppu ledu kavela undhi"), "telugu")
check("Hindi script check",          detect_language("नमस्ते"), "hindi")
check("Tamil script check",          detect_language("வணக்கம்"), "tamil")
check("Telugu script check",         detect_language("నమస్కారం"), "telugu")
check("Kannada script check",        detect_language("ನಮಸ್ಕಾರ"), "kannada")


# ══════════════════════════════════════════════════════════════
# TEST 3 — calculate_risk (20 cases)
# ══════════════════════════════════════════════════════════════
section("TEST 3 — calculate_risk")
from app.utils.parser import calculate_risk

# Standard ratio-based risk
check("31% ratio -> medium",     calculate_risk(25000, 80000, "text"), (50, "medium"))
check("50% ratio -> high",       calculate_risk(40000, 80000, "text"), (80, "high"))
check("6% ratio -> low",         calculate_risk(5000, 80000, "text"), (20, "low"))
check("No data -> low",          calculate_risk(None, None, "text"), (0, "low"))

# Uncertainty word bumps
check("kya safe hai bump",       calculate_risk(25000, 80000, "kya safe hai"), (80, "high"))
check("puriyala bump",           calculate_risk(5000, 80000, "puriyala safe ah"), (50, "medium"))
check("should we bump",          calculate_risk(5000, 80000, "should we take this loan"), (50, "medium"))

# Boundary: exactly 20% ratio
check("20% ratio boundary",      calculate_risk(20000, 100000, "ok"), (50, "medium"))

# Boundary: exactly 40% ratio
check("40% ratio boundary",      calculate_risk(40000, 100000, "ok"), (50, "medium"))

# Boundary: 41% ratio -> high
check("41% ratio -> high",       calculate_risk(41000, 100000, "ok"), (80, "high"))

# High ratio + uncertainty (capped at 100)
check("High + uncertainty cap",  calculate_risk(50000, 80000, "kya safe hai"), (100, "high"))

# Very low ratio
check("1% ratio -> low",         calculate_risk(1000, 100000, "ok"), (20, "low"))

# Very high ratio
check("90% ratio -> high",       calculate_risk(90000, 100000, "ok"), (80, "high"))

# Zero income (avoid division by zero)
check("Zero income -> low",      calculate_risk(5000, 0, "text"), (0, "low"))

# Only uncertainty, no numbers
check("Uncertainty only",        calculate_risk(None, None, "kya safe hai"), (30, "low"))

# EMI with no income
check("EMI no income -> low",    calculate_risk(5000, None, "text"), (0, "low"))

# No EMI with income
check("No EMI with income",      calculate_risk(None, 80000, "text"), (0, "low"))

# Extreme ratio >100% (EMI > income)
check("EMI > income -> high",    calculate_risk(100000, 50000, "ok"), (80, "high"))

# Multiple uncertainty words
check("Multiple uncertainty",    calculate_risk(25000, 80000, "kya safe hai should we"), (80, "high"))

# No uncertainty in clean text
check("Clean text no bump",      calculate_risk(25000, 80000, "I want a loan"), (50, "medium"))

# Extra Risk Edge Cases
check("Negative EMI",            calculate_risk(-5000, 80000, "ok"), (20, "low")) # Handles bad parser data gracefully
check("Negative Income",         calculate_risk(5000, -80000, "ok"), (0, "low")) # Assumes 0 income path
check("Huge EMI vs Small Income",calculate_risk(1000000, 100, "kya"), (100, "high"))
check("Fractional EMI",          calculate_risk(0.1, 1000, "ok"), (20, "low"))
check("Zero EMI",                calculate_risk(0, 50000, "ok"), (0, "low"))
check("Both Zero",               calculate_risk(0, 0, "ok"), (0, "low"))
check("Uncertainty keyword prefix", calculate_risk(15000, 50000, "kyasafehai"), (50, "medium")) # Word boundary test
check("All uncertainty words",   calculate_risk(1000, 100000, "kya safe hai should we safe ah puriyala"), (50, "medium"))


# ══════════════════════════════════════════════════════════════
# TEST 4 — infer_estimated_income (15 cases)
# ══════════════════════════════════════════════════════════════
section("TEST 4 — infer_estimated_income")
from app.utils.parser import infer_estimated_income

# Regex matches
check("salary keyword",          infer_estimated_income({"emi": 25000}, "My salary is 80000 per month"), 80000)
check("income keyword",          infer_estimated_income({"emi": 10000}, "My income is 50000"), 50000)
check("earn keyword",            infer_estimated_income({"emi": 10000}, "I earn 45000 monthly"), 45000)
check("monthly income",          infer_estimated_income({"emi": 10000}, "My monthly income is 60000"), 60000)

# Reverse pattern (number before keyword)
check("60000 salary",            infer_estimated_income({"emi": 10000}, "I get 60000 salary"), 60000)
check("75000 per month",         infer_estimated_income({"emi": 10000}, "75000 per month is my pay"), 75000)

# Fallback: emi * 3
check("Fallback emi*3",          infer_estimated_income({"emi": 20000}, "No income mentioned"), 60000)
check("Fallback small emi",      infer_estimated_income({"emi": 5000}, "Nothing here"), 15000)

# No data at all
check("No entities -> None",     infer_estimated_income({}, "Nothing"), None)
check("Empty text -> None",      infer_estimated_income({}, ""), None)

# EMI present but zero (falsy)
check("EMI zero -> None",        infer_estimated_income({"emi": 0}, "No info"), None)

# SIP in entities, no EMI
check("SIP no EMI -> None",      infer_estimated_income({"sip": 5000}, "abc"), None)

# Both regex and EMI — regex takes priority
check("Regex over fallback",     infer_estimated_income({"emi": 20000}, "salary is 90000"), 90000)

# Large salary
check("Large salary",            infer_estimated_income({"emi": 50000}, "My salary is 500000"), 500000)

# Salary in different positions
check("Trailing salary",         infer_estimated_income({"emi": 10000}, "I have a salary 70000 rupees"), 70000)

# Extra Income Inferences
check("Multiple income keywords",infer_estimated_income({"emi": 5000}, "My salary is 80000 and my income is 90000"), 80000)
check("Missing digits",          infer_estimated_income({"emi": 5000}, "My salary is "), 15000) # Fallback to emi
check("Too short number",        infer_estimated_income({"emi": 1000}, "salary 100"), 3000) # Regex needs 4-9 digits
check("Too long number",         infer_estimated_income({"emi": 1000}, "salary 10000000000"), 3000)
check("Earning keyword",         infer_estimated_income({"emi": 1000}, "my earning is 75000"), 75000)
check("Per month trailing",      infer_estimated_income({"emi": 1000}, "85000 per month"), 85000)
check("Float ignored/truncated", infer_estimated_income({"emi": 1000}, "salary is 50000.50"), 50000)
check("No EMI, No string",       infer_estimated_income(None, ""), None)

# Extreme Income Scenarios
check("Tricky phrasing 1",       infer_estimated_income({"emi": 5000}, "I pay home loan my income tax is 100000"), 100000)
check("Tricky phrasing 2",       infer_estimated_income({"emi": 5000}, "monthly income required is 200000"), 200000) 
check("Negative phrasing",       infer_estimated_income({"emi": 5000}, "I don't have salary"), 15000)
check("Extremely long gap",      infer_estimated_income({"emi": 5000}, "income         is       50000"), 50000)


# ══════════════════════════════════════════════════════════════
# TEST 5 — extract_financial_entities (20 cases)
# ══════════════════════════════════════════════════════════════
section("TEST 5 — extract_financial_entities")
from app.services.entities import extract_financial_entities

# Basic extractions
r = extract_financial_entities("My EMI is 25000 per month")
check("EMI basic",               r.get("emi"), 25000)

r = extract_financial_entities("I invest 5000 in SIP every month")
check("SIP basic",               r.get("sip"), 5000)

r = extract_financial_entities("I need a loan of 5000000 rupees")
check("Loan basic",              r.get("loan_amount"), 5000000)

# All three together
r = extract_financial_entities("EMI 15000 and SIP 3000 for a loan of 2000000")
check("All three",               (r.get("emi"), r.get("sip"), r.get("loan_amount")), (15000, 3000, 2000000))

# Non-financial
r = extract_financial_entities("What is the weather today?")
check("Non-financial all None",  (r.get("emi"), r.get("sip"), r.get("loan_amount")), (None, None, None))

# EMI with different amounts
r = extract_financial_entities("The installment is 30000 monthly")
check("Installment keyword",     r.get("emi"), 30000)

# Loan with mortgage keyword
r = extract_financial_entities("My mortgage is 3000000")
check("Mortgage keyword",        r.get("loan_amount"), 3000000)

# Credit keyword
r = extract_financial_entities("I have credit of 500000")
check("Credit keyword",          r.get("loan_amount"), 500000)

# Edge: no numbers at all
r = extract_financial_entities("I want to start SIP")
check("SIP no number",           r.get("sip"), None)

# Edge: small numbers ignored (< 3 digits)
r = extract_financial_entities("EMI is 50")
check("EMI too small (2 digit)", r.get("emi"), None)

# Edge: EMI with large number
r = extract_financial_entities("EMI of 150000 per month")
check("EMI large number",        r.get("emi"), 150000)

# Empty text
r = extract_financial_entities("")
check("Empty text",              (r.get("emi"), r.get("sip"), r.get("loan_amount")), (None, None, None))

# Multiple amounts near keyword — first one wins
r = extract_financial_entities("loan of 1000000 or 2000000")
check("Loan first amount",       r.get("loan_amount"), 1000000)

# Number before keyword
r = extract_financial_entities("25000 EMI per month")
check("Number before EMI",       r.get("emi"), 25000)

# SIP with larger amount
r = extract_financial_entities("My SIP is 10000 monthly")
check("SIP 10000",               r.get("sip"), 10000)

# Only loan, no EMI/SIP
r = extract_financial_entities("I want a loan of 7500000")
check("Only loan",               (r.get("emi"), r.get("sip"), r.get("loan_amount")), (None, None, 7500000))

# Only EMI, no SIP/loan
r = extract_financial_entities("My EMI is 20000")
check("Only EMI",                (r.get("emi"), r.get("sip"), r.get("loan_amount")), (20000, None, None))

# Only SIP, no EMI/loan
r = extract_financial_entities("I do a SIP of 3000 per month")
check("Only SIP",                (r.get("emi"), r.get("sip"), r.get("loan_amount")), (None, 3000, None))

# Mixed with non-financial context
r = extract_financial_entities("I want to go for a movie and my EMI is 12000. The weather is nice.")
check("EMI in mixed context",    r.get("emi"), 12000)

# Extra Entities Cases
r = extract_financial_entities("EMI 1000 SIP 2000 LOAN 300000")
check("Packed string EMI",       r.get("emi"), 1000)
check("Packed string SIP",       r.get("sip"), 2000)
check("Packed string LOAN",      r.get("loan_amount"), 300000)

r = extract_financial_entities("My emi is about 40000 and sip is around 2500")
check("Distance keywords EMI",   r.get("emi"), 40000)
check("Distance keywords SIP",   r.get("sip"), 2500)

r = extract_financial_entities("15000 20000 30000 EMI")
check("Multiple leading nums",   r.get("emi"), 30000) # Usually picks closest

r = extract_financial_entities("loan 50000 60000 70000")
check("Multiple trailing nums",  r.get("loan_amount"), 50000) # Usually picks closest

r = extract_financial_entities("loan!! 50000... emi?? 20000,,,")
check("Punctuation extraction",  (r.get("loan_amount"), r.get("emi")), (50000, 20000))

r = extract_financial_entities("installment of 12000 rupees")
check("Installment synonym",     r.get("emi"), 12000)


# ══════════════════════════════════════════════════════════════
# TEST 6 — _fallback_financial_detection (15 cases)
# ══════════════════════════════════════════════════════════════
section("TEST 6 — _fallback_financial_detection")

# Positive detections
is_fin, score = _fallback_financial_detection("loan EMI mutual fund stock")
check("Multi-keyword financial",  is_fin, True)
check_true("Score > 0.5 multi",   score > 0.5)

is_fin, score = _fallback_financial_detection("My salary is 80000")
check("Salary financial",         is_fin, True)

is_fin, score = _fallback_financial_detection("I want to invest in mutual fund")
check("Investment keyword",       is_fin, True)

is_fin, score = _fallback_financial_detection("insurance premium is high")
check("Insurance keyword",        is_fin, True)

is_fin, score = _fallback_financial_detection("budget planning for home")
check("Budget keyword",           is_fin, True)

is_fin, score = _fallback_financial_detection("debt consolidation plan")
check("Debt keyword",             is_fin, True)

is_fin, score = _fallback_financial_detection("credit card bill")
check("Credit keyword",           is_fin, True)

is_fin, score = _fallback_financial_detection("stock market crash")
check("Stock keyword",            is_fin, True)

# Negative detections
is_fin, score = _fallback_financial_detection("What is the weather today in Delhi?")
check("Non-financial weather",    is_fin, False)

is_fin, score = _fallback_financial_detection("Let's go watch a movie tonight")
check("Non-financial movie",      is_fin, False)

is_fin, score = _fallback_financial_detection("I like pizza and burgers")
check("Non-financial food",       is_fin, False)

is_fin, score = _fallback_financial_detection("")
check("Empty text",               is_fin, False)

# Score thresholds
is_fin, score = _fallback_financial_detection("emi")
check("Single keyword score",     score, 0.47)

is_fin, score = _fallback_financial_detection("loan emi sip salary income interest investment insurance mutual fund stock budget credit debt")
check("Max keywords score cap",   score <= 0.98, True)

# Extra Fallback NLP Cases
is_fin, score = _fallback_financial_detection("LOAN EMI SIP")
check("Uppercase detection",      is_fin, True)

is_fin, score = _fallback_financial_detection("I am looking for a l-o-a-n")
check("Obfuscated detection",     is_fin, False) # Expected to fail standard keyword check

is_fin, score = _fallback_financial_detection("interest" * 100)
check("Spam repetition keywords", score <= 0.98, True)

is_fin, score = _fallback_financial_detection("a" * 1000)
check("Huge random text",         is_fin, False)


# ══════════════════════════════════════════════════════════════
# TEST 7 — extract_json (12 cases)
# ══════════════════════════════════════════════════════════════
section("TEST 7 — extract_json")
from app.utils.parser import extract_json

check("Plain JSON",              extract_json('{"key": "value"}'), {"key": "value"})
check("Whitespace JSON",         extract_json('  {"a": 1}  '), {"a": 1})
check("Nested JSON",             extract_json('{"a": {"b": 2}}'), {"a": {"b": 2}})
check("Array in JSON",           extract_json('{"items": [1,2,3]}'), {"items": [1, 2, 3]})
check("Boolean JSON",            extract_json('{"flag": true}'), {"flag": True})
check("Null JSON",               extract_json('{"x": null}'), {"x": None})

# Markdown code block wrapping
check("```json wrapper",         extract_json('```json\n{"a":1}\n```'), {"a": 1})
check("``` wrapper",             extract_json('```\n{"b":2}\n```'), {"b": 2})

# Invalid JSON raises ValueError
try:
    extract_json("this is not json")
    check("Invalid raises", False, True)
except ValueError:
    check("Invalid raises ValueError", True, True)

try:
    extract_json("")
    check("Empty raises", False, True)
except ValueError:
    check("Empty raises ValueError", True, True)

# Complex nested
check("Complex nested",          extract_json('{"entities": {"emi": 25000, "sip": null}, "risk": "high"}'),
      {"entities": {"emi": 25000, "sip": None}, "risk": "high"})

# String with special chars
check("Escaped quotes",          extract_json('{"msg": "hello \\"world\\""}'), {"msg": 'hello "world"'})

# Extreme JSON hallucination mocks (LLM returning trash)
try:
    extract_json('```json\n{"data": {broken}}')
    check("Broken nested raises", False, True)
except ValueError:
    check("Broken nested JSON raises ValueError", True, True)

try:
    extract_json('Here is your json: \n```json\n{"a":1}\n```')
    check("JSON leading garbage", False, True)
except ValueError:
    check("JSON leading garbage correctly raises", True, True)

try:
    extract_json('```json\n{"a":1}\n``` \nHope this helps!')
    check("JSON trailing garbage", False, True)
except ValueError:
    check("JSON trailing garbage correctly raises", True, True)


# ══════════════════════════════════════════════════════════════
# TEST 8 — build_financial_advice (12 cases)
# ══════════════════════════════════════════════════════════════
section("TEST 8 — build_financial_advice")
from app.services.nlp import build_financial_advice

# All entities + high risk -> 3 capped
advice = build_financial_advice({"emi": 25000, "sip": 5000, "loan_amount": 5000000}, "high")
check("All entities high -> 3",   len(advice), 3)
check_true("EMI mentioned",       any("25000" in a for a in advice))
check_true("SIP mentioned",       any("5000" in a for a in advice))

# No entities -> generic
advice = build_financial_advice({}, "low")
check("No entities -> 1 generic", len(advice), 1)

# EMI only
advice = build_financial_advice({"emi": 10000}, "low")
check("EMI only -> 1",           len(advice), 1)
check_true("EMI only mentions EMI", "emi" in advice[0].lower() or "EMI" in advice[0])

# SIP only
advice = build_financial_advice({"sip": 3000}, "low")
check("SIP only -> 1",           len(advice), 1)
check_true("SIP only mentions SIP", "sip" in advice[0].lower() or "SIP" in advice[0])

# Loan only + high risk -> 2 (loan advice + risk advice)
advice = build_financial_advice({"loan_amount": 5000000}, "high")
check("Loan + high -> 2",        len(advice), 2)

# High risk with all entities -> capped at 3 (emi, sip, loan, risk -> first 3)
advice = build_financial_advice({"emi": 40000, "sip": 5000, "loan_amount": 3000000}, "high")
check("Cap at 3",                 len(advice), 3)

# Medium risk, no entities -> generic
advice = build_financial_advice({}, "medium")
check("No entities medium -> 1", len(advice), 1)

# Extra Advice Cases
advice = build_financial_advice({"loan_amount": 5000000, "sip": 5000}, "medium")
check("Loan + SIP -> 2", len(advice), 2)
check_true("Mentions loan", any("5000000" in a for a in advice))
check_true("Mentions SIP", any("5000" in a for a in advice))

advice = build_financial_advice({"emi": 1}, "high")
check("EMI + High risk -> 2", len(advice), 2)


# ══════════════════════════════════════════════════════════════
# TEST 9 — Full pipeline (async integration tests, 25+ cases)
# ══════════════════════════════════════════════════════════════
section("TEST 9 — Full pipeline (analyze_financial_conversation)")
from app.services.pipeline import analyze_financial_conversation

async def run_pipeline_tests():
    # ── 9a: Rich financial input ──
    text = "I want to take a home loan of 5000000. My salary is 80000 per month and my EMI would be 40000. I also do SIP of 5000."
    r = await analyze_financial_conversation(text)
    check("9a: transcription set",       r["transcription"] == text, True)
    check("9a: is_financial=True",       r["is_financial"], True)
    check("9a: language=english",        r["language"], "english")
    check("9a: loan_amount exists",      r["entities"].get("loan_amount") is not None, True)
    check("9a: emi exists",              r["entities"].get("emi") is not None, True)
    check("9a: income set",             r["estimated_income"] is not None, True)
    check("9a: risk_score >= 50",        r["risk_score"] >= 50, True)
    check("9a: risk_level=high",         r["risk_level"], "high")
    check("9a: advice non-empty",        len(r["financial_advice"]) > 0, True)
    check("9a: summary non-empty",       len(r["summary"]) > 0, True)
    check("9a: has confidence",          r["confidence_score"] > 0, True)

    # ── 9b: Non-financial text ──
    r2 = await analyze_financial_conversation("Let's go watch a movie tonight and have dinner.")
    check("9b: non-financial",           r2["is_financial"], False)
    check("9b: risk_score=0",            r2["risk_score"], 0)
    check("9b: risk_level=low",          r2["risk_level"], "low")
    check_true("9b: has transcription",  len(r2["transcription"]) > 0)

    # ── 9c: Hinglish ──
    text3 = "Mujhe 20 lakh ka loan chahiye, meri salary 60000 hai aur EMI 15000 dene ki capacity hai"
    r3 = await analyze_financial_conversation(text3)
    check_in("9c: hinglish detected",    r3["language"], {"hinglish", "hindi", "mixed", "english"})
    check("9c: financial detected",      r3["is_financial"], True)
    check_true("9c: has entities",       r3["entities"] is not None)

    # ── 9d: Very short text ──
    r4 = await analyze_financial_conversation("EMI")
    check("9d: short text no crash",     isinstance(r4, dict), True)
    check_true("9d: has all keys",       all(k in r4 for k in ["is_financial", "risk_score", "entities"]))

    # ── 9e: Only SIP mentioned ──
    r5 = await analyze_financial_conversation("I want to start a SIP of 5000 per month for retirement")
    check("9e: SIP financial",           r5["is_financial"], True)
    check("9e: SIP extracted",           r5["entities"].get("sip"), 5000)

    # ── 9f: Large loan, no income/EMI ──
    r6 = await analyze_financial_conversation("I need a loan of 10000000 for buying a house")
    check("9f: loan detected",           r6["is_financial"], True)
    check("9f: loan amount",             r6["entities"].get("loan_amount"), 10000000)
    check("9f: risk low (no emi)",       r6["risk_level"], "low")

    # ── 9g: Multiple sentences, mixed content ──
    r7 = await analyze_financial_conversation("The weather is nice. I need a loan of 5000000. My EMI is 30000. Let's play cricket.")
    check("9g: financial mixed",         r7["is_financial"], True)
    check("9g: entities extracted",      r7["entities"].get("loan_amount"), 5000000)

    # ── 9h: Purely numeric ──
    r8 = await analyze_financial_conversation("25000 50000 80000")
    check("9h: numeric no crash",        isinstance(r8, dict), True)

    # ── 9i: Empty-ish text ──
    r9 = await analyze_financial_conversation("   ")
    check("9i: whitespace no crash",     isinstance(r9, dict), True)

    # ── 9j: Tamil-like financial ──
    r10 = await analyze_financial_conversation("edukkanuma EMI 15000 irukku loan 2000000")
    check("9j: tamil financial",         r10["is_financial"], True)
    check_in("9j: tamil lang",           r10["language"], {"tamil", "mixed"})

    # ── Extra Pipeline Edge Cases ──
    # Emoji and formatting
    r11 = await analyze_financial_conversation("I want 💰 loan of 5000000, EMI is 40000 🏠")
    check("11a: emoji handling",         r11["is_financial"], True)
    check("11b: extracted emi",          r11["entities"].get("emi"), 40000)
    
    # Huge paragraph
    long_text = "I am a software engineer. " * 20 + "My salary is 150000 per month. I want a home loan of 20000000. My EMI is 80000."
    r12 = await analyze_financial_conversation(long_text)
    check("12a: long text parsed",       r12["is_financial"], True)
    check("12b: long text income",       r12["estimated_income"], 150000)
    check("12c: long text risk",         r12["risk_level"], "high")

    # Only SIP and high uncertainty
    r13 = await analyze_financial_conversation("kya mera sip 50000 safe hai bhai puriyala")
    check("13a: SIP with uncertainty",   r13["entities"].get("sip"), 50000)
    check_true("13b: Risk elevated",     r13["risk_score"] > 0)

    # ── Additional Model Hallucination Emulations ──
    # Gibberish input ensuring safe fallback limits
    r14 = await analyze_financial_conversation("asdasdlkj12398 asjdlj123")
    check("14a: gibberish safe",         r14["is_financial"], False)
    
    # Extreme repetition
    r15 = await analyze_financial_conversation("loan " * 1000)
    check("15a: extreme loan repeat",    r15["is_financial"], True)
    
    # Deeply packed numbers
    r16 = await analyze_financial_conversation("loan 1,000,000 emi 500,00 sip 1,00")
    check("16a: comma handling",         r16["is_financial"], True) # Won't extract commas directly via regex but won't crash


# ══════════════════════════════════════════════════════════════
# TEST 10 — llm.py Network / Retry Handling (Async, 15 cases)
# ══════════════════════════════════════════════════════════════

async def run_llm_tests():
    print("\n  TEST 10 — llm.py Resiliency")

    # If key is missing entirely
    with patch("app.services.llm.GROQ_API_KEY", ""):
        res = await analyze_text("loan")
        check("10a: missing key returns empty dict", res, {})

    # Mock timeout exception triggering retries
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Mocked timeout")
        res = await analyze_text("loan data limit")
        check("10b: Timeout yields empty dict", res, {})
        check("10c: Timeout triggers 3 retries", mock_post.call_count, 3)

    # Mock API Error Code (500 Server Error)
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = httpx.Response(500, text="Internal Server Error")
        mock_post.return_value = mock_response
        res = await analyze_text("loan info")
        check("10d: Code 500 yields empty dict safely", res, {})
        check("10e: Code 500 triggers 3 retries", mock_post.call_count, 3)

    # Mock Partial Success (First fail, Second succeeds)
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_fail = httpx.Response(500, text="Temporary Error")
        mock_success = httpx.Response(200, json={"choices": [{"message": {"content": '{"emi": 5000}'}}]})
        mock_post.side_effect = [mock_fail, mock_success]
        
        res = await analyze_text("my emi is 5000")
        check("10f: Recovers on 2nd attempt", res, {"emi": 5000})
        check("10g: 2nd attempt requires PARSER_PROMPT", mock_post.call_count, 2)
        
    # Mock invalid json format triggering the fallback mechanism inside `extract_json` layer
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_bad_json = httpx.Response(200, json={"choices": [{"message": {"content": 'bad syntax'}}]})
        mock_post.return_value = mock_bad_json
        
        res = await analyze_text("i want emi")
        check("10h: extract_json ValueError safely caught", res, {})
        check("10i: extract_json ValueError triggers 3 retries", mock_post.call_count, 3)

asyncio.run(run_pipeline_tests())
asyncio.run(run_llm_tests())


# ══════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print(f"  TOTAL: {total} tests | PASSED: {total - failures} | FAILED: {failures}")
if failures:
    print(f"  \033[91m{failures} FAILURES\033[0m")
    print(f"\n  Failed tests:")
    for label, actual, expected in failure_details:
        print(f"    x {label}")
        print(f"      got:      {actual!r}")
        print(f"      expected: {expected!r}")
else:
    print(f"  \033[92mAll {total} tests PASSED!\033[0m")
print(f"{'='*60}\n")

sys.exit(1 if failures else 0)
