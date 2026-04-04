import base64
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.stt import transcribe_audio
from app.services.pipeline import analyze_financial_conversation
from app.utils.parser import normalize_numbers
from app.schemas.response_schema import PredictResponse, build_fallback_response

router = APIRouter()

class RequestModel(BaseModel):
    input_type: str
    data: str

@router.post("/predict", response_model=PredictResponse)
async def predict_endpoint(req: RequestModel):
    try:
        if req.input_type == "audio":
            bdata = req.data.split(",")[-1] if "," in req.data else req.data
            text = await transcribe_audio(base64.b64decode(bdata))
        else:
            text = normalize_numbers(req.data)
            
        if not text:
            raise ValueError("Input is empty after transcription/processing")

        result = await analyze_financial_conversation(text)
        return PredictResponse(**result)
    except Exception as e:
        print(f"Prediction Error: {e}")
        return PredictResponse(**build_fallback_response())
