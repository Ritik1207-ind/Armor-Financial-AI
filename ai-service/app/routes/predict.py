import base64
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.stt import transcribe_audio
from app.services.pipeline import analyze_financial_conversation
from app.utils.parser import normalize_numbers
from app.schemas.response_schema import PredictResponse, build_fallback_response

logger = logging.getLogger("armor.predict")
router = APIRouter()


class RequestModel(BaseModel):
    input_type: str
    data: str
    filename: str = None

@router.post("/predict", response_model=PredictResponse)
async def predict_endpoint(req: RequestModel):
    try:
        text = ""
        if req.input_type == "audio":
            # Fix base64 padding
            b64_str = req.data.split(",")[-1] if "," in req.data else req.data
            padding = len(b64_str) % 4
            if padding:
                b64_str += "=" * (4 - padding)
            
            text = await transcribe_audio(base64.b64decode(b64_str), req.filename)
        else:
            text = normalize_numbers(req.data)
            
        if not text or not text.strip():
            return PredictResponse(**build_fallback_response())

        result = await analyze_financial_conversation(text)
        return PredictResponse.model_validate(result)
    except Exception as e:
        logger.error(f"Prediction Error: {e}")
        return PredictResponse(**build_fallback_response())
