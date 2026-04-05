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

    # Regex-based entity extraction (fallback)
    entities = extract_financial_entities(normalized_text)
    response["entities"] = entities

    # Estimate income from regex
    response["estimated_income"] = infer_estimated_income(entities, normalized_text) or 0

    # NLP-based summary and advice
    response["summary"] = await summarize_financial_text(normalized_text)

    emi_val = entities.get("emi_amount") or entities.get("emi")
    score, level = calculate_risk(emi_val, response["estimated_income"], normalized_text)
    response["risk_score"] = score
    response["risk_level"] = level
    response["risk_explanation"] = (
        "Risk is estimated from EMI-to-income balance and uncertainty markers in the conversation."
    )
    response["financial_advice"] = build_financial_advice(entities, level)

    # LLM analysis (primary source of truth)
    llm_result = await analyze_text(normalized_text)
    if llm_result:
        response.update(
            {
                "is_financial": llm_result.get("is_financial", response["is_financial"]),
                "summary": llm_result.get("summary") or response["summary"],
                "sentiment": llm_result.get("sentiment", response["sentiment"]),
                "risk_explanation": llm_result.get("risk_explanation", response["risk_explanation"]),
                "financial_advice": llm_result.get("financial_advice") or response["financial_advice"],
                "user_emotion": llm_result.get("user_emotion", response["user_emotion"]),
                "user_confidence": llm_result.get("user_confidence", response["user_confidence"]),
                "good_decisions": llm_result.get("good_decisions", response["good_decisions"]),
            }
        )

        # Merge LLM entities — LLM overwrites regex only when the LLM value is truthy (non-zero)
        llm_entities = llm_result.get("entities") or {}
        for key, value in llm_entities.items():
            if value:  # only overwrite if LLM actually found something (not 0, not None, not "")
                response["entities"][key] = value

        # Map old regex keys to new schema keys so frontend sees them
        ents = response["entities"]
        if ents.get("emi") and not ents.get("emi_amount"):
            ents["emi_amount"] = ents["emi"]
        if ents.get("sip") and not ents.get("sip_amount"):
            ents["sip_amount"] = ents["sip"]

        # Update estimated_income from LLM if available
        if llm_result.get("estimated_income"):
            response["estimated_income"] = llm_result["estimated_income"]

    # Final risk recalculation with merged data
    final_emi = response["entities"].get("emi_amount") or response["entities"].get("emi")
    final_income = response["entities"].get("income") or response["estimated_income"]
    if final_income:
        response["estimated_income"] = final_income

    score, level = calculate_risk(final_emi, response["estimated_income"], normalized_text)
    response["risk_score"] = score
    response["risk_level"] = level

    return response
