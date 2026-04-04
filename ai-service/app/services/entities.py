import re
from typing import Any

import spacy
from spacy.language import Language
from spacy.matcher import Matcher


def _build_nlp() -> Language:
    nlp = spacy.blank("en")
    matcher = Matcher(nlp.vocab)
    matcher.add("EMI", [[{"LOWER": {"IN": ["emi", "installment"]}}]])
    matcher.add("SIP", [[{"LOWER": "sip"}]])
    matcher.add(
        "LOAN",
        [[{"LOWER": {"IN": ["loan", "mortgage", "credit"]}}]],
    )
    nlp.meta["financial_matcher"] = matcher
    return nlp


NLP = _build_nlp()


def _extract_amounts(text: str) -> list[tuple[int, int, int]]:
    return [(m.start(), m.end(), int(m.group())) for m in re.finditer(r"\b\d{3,9}\b", text)]


def extract_financial_entities(text: str) -> dict[str, Any]:
    doc = NLP(text)
    matcher: Matcher = NLP.meta["financial_matcher"]
    entities = {"emi": None, "sip": None, "loan_amount": None}
    all_amounts = _extract_amounts(text)

    for match_id, start, end in matcher(doc):
        label = NLP.vocab.strings[match_id]
        keyword_end = doc[end - 1].idx + len(doc[end - 1].text)
        
        # Search forward first, then backward
        forward = [a for a in all_amounts if a[0] >= keyword_end and a[0] < keyword_end + 50]
        backward = [a for a in all_amounts if a[1] <= doc[start].idx and a[1] > doc[start].idx - 50]
        
        candidates = sorted(forward, key=lambda x: x[0]) + sorted(backward, key=lambda x: x[1], reverse=True)
        
        if candidates:
            amount = candidates[0][2]
            if label == "EMI":
                entities["emi"] = amount
            elif label == "SIP":
                entities["sip"] = amount
            elif label == "LOAN":
                entities["loan_amount"] = amount

    return entities
