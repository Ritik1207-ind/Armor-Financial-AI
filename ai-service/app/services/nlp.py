import os
import logging
from functools import lru_cache
from typing import Any

from huggingface_hub import AsyncInferenceClient

logger = logging.getLogger("armor.nlp")

HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")
TOPIC_MODEL = os.getenv("HF_TOPIC_MODEL", "facebook/bart-large-mnli")
SUMMARY_MODEL = os.getenv("HF_SUMMARY_MODEL", "sshleifer/distilbart-cnn-12-6")


@lru_cache(maxsize=1)
def _hf_client() -> AsyncInferenceClient | None:
    if not HF_API_TOKEN:
        return None
    return AsyncInferenceClient(api_key=HF_API_TOKEN, timeout=15)


def _fallback_financial_detection(text: str) -> tuple[bool, float]:
    keywords = {
        "emi",
        "sip",
        "loan",
        "credit",
        "debt",
        "interest",
        "investment",
        "salary",
        "income",
        "insurance",
        "mutual fund",
        "stock",
        "budget",
    }
    lowered = text.lower()
    hits = sum(1 for kw in keywords if kw in lowered)
    score = min(0.35 + (hits * 0.12), 0.98) if hits else 0.08
    return hits > 0, round(score, 2)


async def detect_financial_topic(text: str) -> tuple[bool, float]:
    labels = ["financial conversation", "general conversation"]

    # Try remote HuggingFace Inference API only (no local model loading)
    client = _hf_client()
    if client is not None:
        try:
            result = await client.zero_shot_classification(
                text,
                labels,
                model=TOPIC_MODEL,
                multi_label=False,
            )
            label = result.labels[0]
            score = float(result.scores[0])
            return label == "financial conversation", round(score, 2)
        except Exception as e:
            logger.warning(f"HF topic classification failed, using fallback: {e}")

    return _fallback_financial_detection(text)


async def summarize_financial_text(text: str) -> str:
    if len(text.split()) < 8:
        return text.strip()

    # Try remote HuggingFace Inference API only (no local model loading)
    client = _hf_client()
    if client is not None:
        try:
            output = await client.summarization(text, model=SUMMARY_MODEL)
            summary = getattr(output, "summary_text", None) or str(output)
            return summary.strip()
        except Exception as e:
            logger.warning(f"HF summarization failed, using fallback: {e}")

    # Fast local fallback — just take the first 2 sentences
    sentences = [segment.strip() for segment in text.replace("\n", " ").split(".") if segment.strip()]
    return ". ".join(sentences[:2]).strip() or text[:220].strip()


def build_financial_advice(entities: dict[str, Any], risk_level: str) -> list[str]:
    advice: list[str] = []
    emi = entities.get("emi")
    sip = entities.get("sip")
    loan_amount = entities.get("loan_amount")

    if emi:
        advice.append(f"Verify whether the EMI of {emi} fits the monthly budget before committing.")
    if sip:
        advice.append(f"Confirm that the SIP amount of {sip} aligns with long-term goals and cash flow.")
    if loan_amount:
        advice.append(f"Review repayment options and total interest for the loan amount of {loan_amount}.")
    if risk_level == "high":
        advice.append("Discuss affordability and emergency-buffer impact before finalizing the decision.")
    if not advice:
        advice.append("Review the transcript and validate the extracted financial numbers before acting.")

    return advice[:3]
