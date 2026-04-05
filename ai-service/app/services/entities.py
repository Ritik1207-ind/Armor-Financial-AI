import re
from typing import Any

import spacy
from spacy.language import Language
from spacy.matcher import Matcher


def _build_nlp() -> Language:
    nlp = spacy.blank("en")
    matcher = Matcher(nlp.vocab)
    matcher.add("EMI", [[{"LOWER": {"IN": ["emi", "installment", "payment", "payout", "kist"]}}]])
    matcher.add("SIP", [[{"LOWER": "sip"}]])
    matcher.add(
        "LOAN",
        [[{"LOWER": {"IN": ["loan", "mortgage", "credit"]}}]],
    )
    matcher.add("INCOME", [[{"LOWER": {"IN": ["income", "salary", "account", "earn", "kamaata"]}}]])
    nlp.meta["financial_matcher"] = matcher
    return nlp


NLP = _build_nlp()


def _extract_amounts(text: str) -> list[tuple[int, int, int]]:
    return [(m.start(), m.end(), int(m.group())) for m in re.finditer(r"\b\d{3,9}\b", text)]


def _extract_interest_rates(text: str) -> list[float]:
    """Extract percentage interest rates like '9.5 interest', '13%', '12 percent'"""
    rates = []
    for m in re.finditer(r"(\d+(?:\.\d+)?)\s*(?:%|percent|interest)", text, re.IGNORECASE):
        val = float(m.group(1))
        if 0 < val < 50:  # sane interest rate range
            rates.append(val)
    return rates


def _extract_bank_names(text: str) -> list[str]:
    """Extract known bank names"""
    banks = []
    known_banks = [
        "HDFC", "SBI", "ICICI", "HTSC", "Axis", "Kotak", "Yes Bank",
        "PNB", "BOB", "Bank of Baroda", "Canara", "Union Bank",
        "IndusInd", "Federal Bank", "IDFC", "Bandhan", "RBL",
    ]
    text_upper = text.upper()
    for bank in known_banks:
        if bank.upper() in text_upper:
            banks.append(bank)
    return banks


def _extract_investments(text: str) -> list[str]:
    """Extract investment type mentions"""
    investments = []
    known = [
        "SIP", "mutual fund", "mutual funds", "Nifty 50", "Nifty",
        "RD", "recurring deposit", "FD", "fixed deposit",
        "PPF", "NPS", "gold", "stocks", "shares", "post office",
    ]
    text_lower = text.lower()
    for inv in known:
        if inv.lower() in text_lower:
            investments.append(inv)
    return list(set(investments))


def _extract_tenure(text: str) -> int:
    """Extract loan tenure in years"""
    m = re.search(r"(\d+)\s*(?:years?|saal|yr)\b", text, re.IGNORECASE)
    if m:
        return int(m.group(1))
    return 0


def extract_financial_entities(text: str) -> dict[str, Any]:
    doc = NLP(text)
    matcher: Matcher = NLP.meta["financial_matcher"]
    entities: dict[str, Any] = {
        "emi": None, "sip": None, "loan_amount": None, "income": None,
        "emi_amount": None, "sip_amount": None,
        "rate_of_interest_loan": None, "rate_of_interest_emi": None,
        "loan_tenure_years": None,
        "banks_mentioned": [], "investments": [], "time_period": None,
    }
    all_amounts = _extract_amounts(text)

    for match_id, start, end in matcher(doc):
        label = NLP.vocab.strings[match_id]
        keyword_end = doc[end - 1].idx + len(doc[end - 1].text)

        # Gather candidates within 50 characters
        candidates = []
        for a in all_amounts:
            # Distance from keyword end to number start
            dist_forward = a[0] - keyword_end if a[0] >= keyword_end else float('inf')
            # Distance from number end to keyword start
            dist_backward = doc[start].idx - a[1] if a[1] <= doc[start].idx else float('inf')
            
            min_dist = min(dist_forward, dist_backward)
            if min_dist < 60:  # slightly expanded window
                candidates.append((a, min_dist))
                
        # Sort by distance
        candidates.sort(key=lambda x: x[1])

        if candidates:
            amount = candidates[0][0][2]
            if label == "EMI":
                if not entities.get("emi"):
                    entities["emi"] = amount
                    entities["emi_amount"] = amount
            elif label == "SIP":
                if not entities.get("sip"):
                    entities["sip"] = amount
                    entities["sip_amount"] = amount
            elif label == "LOAN":
                # Loan amount is usually the largest number associated with a loan keyword
                if not entities.get("loan_amount") or amount > entities["loan_amount"]:
                    entities["loan_amount"] = amount
            elif label == "INCOME":
                entities["income"] = amount

    # Extract interest rates
    rates = _extract_interest_rates(text)
    if rates:
        entities["rate_of_interest_loan"] = rates[0]
        if len(rates) > 1:
            entities["rate_of_interest_emi"] = rates[1]

    # Extract bank names
    banks = _extract_bank_names(text)
    if banks:
        entities["banks_mentioned"] = banks

    # Extract investment types
    investments = _extract_investments(text)
    if investments:
        entities["investments"] = investments

    # Extract tenure
    tenure = _extract_tenure(text)
    if tenure:
        entities["loan_tenure_years"] = tenure
        entities["time_period"] = f"{tenure} years"

    # Direct income pattern extraction — OVERRIDES spaCy proximity matching
    # because "have a 50000 rupees account" is a more reliable pattern
    income_patterns = [
        r"(\d{4,9})\s*(?:rupees?|rs\.?)\s*(?:account|income|salary)",
        r"(?:income|salary|kamaata|earn)\s*(?:is|hai|of)?\s*(?:rs\.?|rupees?)?\s*(\d{4,9})",
        r"(?:have|has)\s*(?:a\s+)?(\d{4,9})\s*(?:rupees?|rs\.?)",
    ]
    for pat in income_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val = int(m.group(1))
            if val >= 10000:
                entities["income"] = val
                break

    return entities
