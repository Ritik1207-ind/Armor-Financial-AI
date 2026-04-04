from app.schemas.response_schema import build_fallback_response
from app.services.entities import extract_financial_entities
from app.services.llm import analyze_text
from app.services.nlp import build_financial_advice, detect_financial_topic, summarize_financial_text
from app.utils.parser import calculate_risk, detect_language, infer_estimated_income


async def analyze_financial_conversation(text: str) -> dict:
    response = build_fallback_response()
    normalized_text = text.strip()

    response["transcription"] = normalized_text
    response["language"] = detect_language(normalized_text)

    is_financial, confidence = await detect_financial_topic(normalized_text)
    response["is_financial"] = is_financial
    response["confidence_score"] = confidence

    entities = extract_financial_entities(normalized_text)
    response["entities"] = entities
    response["estimated_income"] = infer_estimated_income(entities, normalized_text)
    response["summary"] = await summarize_financial_text(normalized_text)

    score, level = calculate_risk(
        entities.get("emi"),
        response["estimated_income"],
        normalized_text,
    )
    response["risk_score"] = score
    response["risk_level"] = level
    response["risk_explanation"] = (
        "Risk is estimated from EMI-to-income balance and uncertainty markers in the conversation."
    )
    response["financial_advice"] = build_financial_advice(entities, level)

    llm_result = await analyze_text(normalized_text)
    if llm_result:
        response.update(
            {
                "summary": llm_result.get("summary") or response["summary"],
                "sentiment": llm_result.get("sentiment", response["sentiment"]),
                "risk_explanation": llm_result.get("risk_explanation", response["risk_explanation"]),
                "financial_advice": llm_result.get("financial_advice") or response["financial_advice"],
            }
        )

        llm_entities = llm_result.get("entities") or {}
        for key, value in llm_entities.items():
            if value and not response["entities"].get(key):
                response["entities"][key] = value

        if llm_result.get("estimated_income") and not response["estimated_income"]:
            response["estimated_income"] = llm_result["estimated_income"]

    score, level = calculate_risk(
        response["entities"].get("emi"),
        response["estimated_income"],
        normalized_text,
    )
    response["risk_score"] = score
    response["risk_level"] = level

    return response
