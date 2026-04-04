"""Compact diagnostic test — prints only critical info."""
import asyncio, sys, os
sys.path.insert(0, ".")
from dotenv import load_dotenv
load_dotenv()

results = []

def chk(label, actual, expected):
    ok = actual == expected
    results.append((ok, label, actual, expected))

# 1. normalize_numbers
from app.utils.parser import normalize_numbers
chk("norm/10k",        normalize_numbers("EMI of 10k"),          "EMI of 10000")
chk("norm/hazaar",     normalize_numbers("15 hazaar monthly"),   "15000 monthly")
chk("norm/lakh",       normalize_numbers("loan 50 lakh"),        "loan 5000000")
chk("norm/crore",      normalize_numbers("2 crore property"),    "20000000 property")
chk("norm/5.5k",       normalize_numbers("5.5k EMI"),            "5500 EMI")
chk("norm/plain",      normalize_numbers("hello world"),         "hello world")

# 2. detect_language
from app.utils.parser import detect_language
chk("lang/english",   detect_language("I want a home loan"),                 "english")
chk("lang/hinglish1", detect_language("loan hazaar mein hai"),               "hinglish")
chk("lang/hinglish2", detect_language("kya yeh loan safe hai"),              "hinglish")
chk("lang/tamil",     detect_language("edukkanuma safe ah irukku"),          "tamil")
chk("lang/telugu",    detect_language("undhi emiti kavela"),                 "telugu")

# 3. calculate_risk
from app.utils.parser import calculate_risk
chk("risk/medium",    calculate_risk(25000, 80000, "text"),           (50, "medium"))
chk("risk/high",      calculate_risk(40000, 80000, "text"),           (80, "high"))
chk("risk/low",       calculate_risk(5000, 80000, "text"),            (20, "low"))
chk("risk/nodata",    calculate_risk(None, None, "text"),             (0, "low"))
chk("risk/uncertain", calculate_risk(25000, 80000, "kya safe hai"),  (80, "high"))
chk("risk/lowemi+unc",calculate_risk(5000, 80000, "puriyala safe ah"),(50,"medium"))

# 4. infer_estimated_income
from app.utils.parser import infer_estimated_income
chk("income/salary",   infer_estimated_income({"emi":25000}, "My salary is 80000 per month"), 80000)
chk("income/income",   infer_estimated_income({"emi":10000}, "My income is 50000"),            50000)
chk("income/fallback", infer_estimated_income({"emi":20000}, "No income mentioned here"),      60000)
chk("income/none",     infer_estimated_income({}, "Nothing"),                                  None)

# 5. extract_financial_entities
from app.services.entities import extract_financial_entities
r = extract_financial_entities("My EMI is 25000 per month")
chk("ent/emi",    r.get("emi"),         25000)
r = extract_financial_entities("I invest 5000 in SIP every month")
chk("ent/sip",    r.get("sip"),         5000)
r = extract_financial_entities("I need a loan of 5000000 rupees")
chk("ent/loan",   r.get("loan_amount"), 5000000)
r = extract_financial_entities("EMI 15000 and SIP 3000 for a loan of 2000000")
chk("ent/all",    (r.get("emi"), r.get("sip"), r.get("loan_amount")), (15000, 3000, 2000000))
r = extract_financial_entities("What is the weather?")
chk("ent/none",   (r.get("emi"), r.get("sip"), r.get("loan_amount")), (None, None, None))

# 6. _fallback_financial_detection
from app.services.nlp import _fallback_financial_detection
chk("detect/fin",    _fallback_financial_detection("loan EMI mutual fund")[0], True)
chk("detect/nonfin", _fallback_financial_detection("What is the weather today?")[0], False)
chk("detect/salary", _fallback_financial_detection("My salary is 80000")[0], True)

# 7. extract_json
from app.utils.parser import extract_json
chk("json/plain",  extract_json('{"key": "value"}'), {"key": "value"})
chk("json/spaces", extract_json('  {"a": 1}  '),      {"a": 1})

# 8. build_financial_advice
from app.services.nlp import build_financial_advice
adv = build_financial_advice({"emi":25000,"sip":5000,"loan_amount":5000000}, "high")
chk("advice/max3", len(adv), 3)
adv = build_financial_advice({}, "low")
chk("advice/generic", len(adv), 1)

# 9. pipeline integration (async)
from app.services.pipeline import analyze_financial_conversation

async def pipeline_tests():
    # 9a rich financial
    t = "I want to take a home loan of 5000000. My salary is 80000 per month and my EMI would be 40000. I also do SIP of 5000."
    r = await analyze_financial_conversation(t)
    chk("pipe/is_financial",     r["is_financial"],                                   True)
    chk("pipe/language",         r["language"],                                        "english")
    chk("pipe/has_loan",         r["entities"].get("loan_amount") is not None,        True)
    chk("pipe/has_emi",          r["entities"].get("emi") is not None,                True)
    chk("pipe/income_set",       r["estimated_income"] is not None,                   True)
    chk("pipe/risk_high",        r["risk_level"],                                      "high")
    chk("pipe/has_advice",       len(r["financial_advice"]) > 0,                      True)
    chk("pipe/has_summary",      len(r["summary"]) > 0,                               True)

    # 9b non-financial
    r2 = await analyze_financial_conversation("Let's go watch a movie tonight.")
    chk("pipe/nonfin",           r2["is_financial"],    False)
    chk("pipe/nonfin_risk",      r2["risk_score"],      0)

    # 9c Hinglish
    r3 = await analyze_financial_conversation("Mujhe 20 lakh ka loan chahiye, meri salary 60000 hai")
    chk("pipe/hinglish_fin",     r3["is_financial"],    True)

    # 9d Edge: very short
    r4 = await analyze_financial_conversation("EMI")
    chk("pipe/short_no_crash",   isinstance(r4, dict),  True)

asyncio.run(pipeline_tests())

# ── Summary ──────────────────────────────────────────────────────
passed = sum(1 for ok,*_ in results if ok)
failed = [(l,a,e) for ok,l,a,e in results if not ok]
total  = len(results)
print(f"\nRESULTS: {passed}/{total} passed")
if failed:
    print(f"\nFAILURES ({len(failed)}):")
    for label, actual, expected in failed:
        print(f"  FAIL  {label}")
        print(f"        got:      {actual!r}")
        print(f"        expected: {expected!r}")
else:
    print("All tests PASSED")
