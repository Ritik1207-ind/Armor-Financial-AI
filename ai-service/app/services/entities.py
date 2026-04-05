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
    matcher.add("INCOME", [[{"LOWER": {"IN": ["income", "salary", "kamaata"]}}]])
    nlp.meta["financial_matcher"] = matcher
    return nlp


NLP = _build_nlp()


def _normalize_indian_numbers(text: str) -> str:
    """Strip Indian-format commas from numbers: ₹30,00,000 -> 3000000"""
    text = re.sub(r'₹\s*', '', text)           # remove ₹ symbol
    text = re.sub(r'(\d),(\d)', r'\1\2', text)  # strip commas first pass
    text = re.sub(r'(\d),(\d)', r'\1\2', text)  # second pass for overlapping
    return text


def _extract_amounts(text: str) -> list[tuple[int, int, int]]:
    """Extract 4-9 digit numbers from normalized text."""
    return [(m.start(), m.end(), int(m.group())) for m in re.finditer(r"\b\d{4,9}\b", text)]


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
        "State Bank of India", "Punjab National Bank",
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
        "ELSS", "equity", "crypto", "cryptocurrency", "Zerodha",
    ]
    text_lower = text.lower()
    for inv in known:
        if inv.lower() in text_lower:
            investments.append(inv)
    return list(set(investments))


def _extract_tenure(text: str) -> int:
    """Extract loan tenure in years — must have loan context nearby"""
    # Match X years/saal only when preceded by loan context within 60 chars
    for m in re.finditer(r"(\d+)\s*(?:years?|saal|yr)\b", text, re.IGNORECASE):
        tenure = int(m.group(1))
        if tenure < 3 or tenure > 35:
            continue  # Skip ages (24 saal ka engineer) and nonsensical tenures
        # Check if there's a loan-related word within 100 chars before
        context = text[max(0, m.start()-100):m.start()]
        if re.search(r"\b(?:loan|tenure|repay|emi|mortgage)\b", context, re.IGNORECASE):
            return tenure
    return 0


def _extract_loan_amounts_by_pattern(text: str) -> list[int]:
    """Directly extract loan amounts using loan-specific phrase patterns."""
    amounts = []
    # Patterns: 'loan of X', 'liya tha X ka', 'loan X ka', 'loan amount X'
    patterns = [
        r"(?:home\s+loan|personal\s+loan|loan)\s+(?:chal\s+raha\s+hai\s+)?(?:jo\s+maine\s+)?(?:[\w\s]+?se\s+liya\s+tha\s+)(\d{5,9})\s*ka",
        r"(?:loan|mortgage)\s+(?:of\s+|amounting\s+to\s+)?(?:rs\.?|rupees?|inr)?\s*(\d{5,9})",
        r"(?:liya\s+tha|liya\s+hai)\s+(\d{5,9})\s*(?:ka|ke)",
        r"(?:loan\s+amount|principal)\s*(?:is|was|:)?\s*(?:rs\.?|rupees?)?\s*(\d{5,9})",
    ]
    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            val = int(m.group(1))
            if val >= 50000:
                amounts.append(val)
    return amounts


def _is_expense_not_emi(text: str, amount_pos: int) -> bool:
    """Return True if the number appears before 'ke alawa' as an expense total (not an EMI)."""
    after = text[amount_pos:amount_pos+50]
    return bool(re.search(r"\bke\s+alawa\b", after, re.IGNORECASE))


def extract_financial_entities(text: str) -> dict[str, Any]:
    # Step 1: Normalize ₹30,00,000 -> 3000000 BEFORE any matching
    norm_text = _normalize_indian_numbers(text)

    doc = NLP(norm_text)
    matcher: Matcher = NLP.meta["financial_matcher"]
    entities: dict[str, Any] = {
        "emi": None, "sip": None, "loan_amount": None, "income": None,
        "emi_amount": None, "sip_amount": None,
        "rate_of_interest_loan": None, "rate_of_interest_investment": None,
        "loan_tenure_years": None,
        "banks_mentioned": [], "investments": [], "time_period": None,
        # Multi-entity tracking
        "all_loan_amounts": [],
        "all_emi_amounts": [],
        "all_sip_amounts": [],
        "all_loan_tenures": [],
        "all_interest_rates_loan": [],
        "total_emi_burden": None,
        "total_loan_exposure": None,
        "loans": [],
    }
    all_amounts = _extract_amounts(norm_text)

    for match_id, start, end in matcher(doc):
        label = NLP.vocab.strings[match_id]
        keyword_end = doc[end - 1].idx + len(doc[end - 1].text)

        candidates = []
        for a in all_amounts:
            dist_forward = a[0] - keyword_end if a[0] >= keyword_end else float('inf')
            dist_backward = doc[start].idx - a[1] if a[1] <= doc[start].idx else float('inf')
            min_dist = min(dist_forward, dist_backward)
            if min_dist < 60:
                candidates.append((a, min_dist))

        candidates.sort(key=lambda x: x[1])

        if candidates:
            amount = candidates[0][0][2]
            if label == "EMI":
                # Skip if this is an expense total before 'ke alawa' (not an actual EMI)
                if _is_expense_not_emi(norm_text, candidates[0][0][0]):
                    continue
                # Track ALL unique EMI amounts
                if amount not in entities["all_emi_amounts"]:
                    entities["all_emi_amounts"].append(amount)
                # Primary EMI = first detected
                if not entities.get("emi"):
                    entities["emi"] = amount
                    entities["emi_amount"] = amount
            elif label == "SIP":
                if amount not in entities["all_sip_amounts"]:
                    entities["all_sip_amounts"].append(amount)
                if not entities.get("sip"):
                    entities["sip"] = amount
                    entities["sip_amount"] = amount
            elif label == "LOAN":
                # Collect ALL distinct loan amounts > 50k
                if amount > 50000 and amount not in entities["all_loan_amounts"]:
                    entities["all_loan_amounts"].append(amount)
                # Primary loan = largest (home loan > personal loan)
                if not entities.get("loan_amount") or amount > entities["loan_amount"]:
                    entities["loan_amount"] = amount
            elif label == "INCOME":
                entities["income"] = amount

    # Total EMI burden = sum of ALL detected EMIs
    if entities["all_emi_amounts"]:
        entities["total_emi_burden"] = sum(entities["all_emi_amounts"])
        entities["emi_amount"] = entities["total_emi_burden"]

    # Total Loan Exposure
    pattern_loans = _extract_loan_amounts_by_pattern(norm_text)
    for loan_val in pattern_loans:
        if loan_val not in entities["all_loan_amounts"] and loan_val > 50000:
            entities["all_loan_amounts"].append(loan_val)
        if not entities.get("loan_amount") or loan_val > entities["loan_amount"]:
            entities["loan_amount"] = loan_val
            
    if entities["all_loan_amounts"]:
        entities["total_loan_exposure"] = sum(entities["all_loan_amounts"])

    # Total SIP = sum of all SIPs detected
    if entities["all_sip_amounts"]:
        entities["sip_amount"] = sum(entities["all_sip_amounts"])

    # Extract interest rates
    rates = _extract_interest_rates(norm_text)
    if rates:
        # Assuming all smaller rates < 11% are home loans, >= 11% are personal loans. 
        # We no longer hardcode > 11.5% as investment returns because personal loans are usually 11-18%
        entities["all_interest_rates_loan"] = rates
        entities["rate_of_interest_loan"] = rates[0]

    # Extract bank names
    banks = _extract_bank_names(norm_text)
    if banks:
        entities["banks_mentioned"] = banks

    # Extract investment types
    investments = _extract_investments(norm_text)
    if investments:
        entities["investments"] = investments

    # Extract tenure
    tenure_years = []
    for m in re.finditer(r"(\d+)\s*(?:years?|saal|yr)\b", norm_text, re.IGNORECASE):
        t = int(m.group(1))
        if 3 <= t <= 35:
            context = norm_text[max(0, m.start()-100):m.start()]
            if re.search(r"\b(?:loan|tenure|repay|emi|mortgage)\b", context, re.IGNORECASE):
                tenure_years.append(t)
    
    if tenure_years:
        entities["all_loan_tenures"] = tenure_years
        entities["loan_tenure_years"] = tenure_years[0]
        entities["time_period"] = f"{tenure_years[0]} years"

    # Direct income regex - runs on normalized text (no ₹ symbol, no commas)
    income_patterns = [
        r"(?:salary|income|kamaata|earn)\s*(?:is|hai|of|:)?\s*(?:rs\.?|rupees?|inr)?\s*(\d{4,9})",
        r"(?:rs\.?|rupees?|inr)\s*(\d{4,9})\s*(?:monthly\s+)?(?:salary|income|in-hand)",
        r"(?:monthly\s+)?(?:salary|income)\s*(?:rs\.?|rupees?|inr)?\s*(\d{4,9})",
    ]
    for pat in income_patterns:
        m = re.search(pat, norm_text, re.IGNORECASE)
        if m:
            val = int(m.group(1))
            if 5000 <= val <= 2000000:
                entities["income"] = val
                break

    return entities
