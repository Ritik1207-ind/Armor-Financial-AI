from pydantic import BaseModel, Field
from typing import List, Optional

class EntitiesModel(BaseModel):
    emi: Optional[int] = None
    sip: Optional[int] = None
    loan_amount: Optional[int] = None

class PredictResponse(BaseModel):
    transcription: str = ""
    language: str = "english"
    is_financial: bool = False
    entities: EntitiesModel = Field(default_factory=EntitiesModel)
    estimated_income: Optional[int] = None
    summary: str = ""
    sentiment: str = "neutral"
    risk_score: int = 0
    risk_level: str = "low"
    risk_explanation: str = ""
    financial_advice: List[str] = Field(default_factory=list)
    confidence_score: float = 0.0

def build_fallback_response() -> dict:
    return PredictResponse().model_dump()
