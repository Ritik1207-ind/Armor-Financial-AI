from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
import re


class LoanDetail(BaseModel):
    """Represents a single loan with all its terms."""
    loan_type: Optional[str] = None        # "home loan", "personal loan", "car loan"
    amount: Optional[int] = None           # Principal amount
    emi: Optional[int] = None              # Monthly EMI
    interest_rate: Optional[float] = None  # Annual interest rate %
    tenure_years: Optional[int] = None     # Tenure in years
    bank: Optional[str] = None             # Lending bank


class EntitiesModel(BaseModel):
    income: Optional[int] = None
    emi_amount: Optional[int] = None          # Total combined EMI burden
    sip_amount: Optional[int] = None          # Total combined SIP investment
    loan_amount: Optional[int] = None         # Primary (largest) loan
    total_loan_exposure: Optional[int] = None # Sum of ALL loan principals
    loan_tenure_years: Optional[int] = None   # Primary loan tenure
    rate_of_interest_loan: Optional[float] = None       # Primary loan rate
    rate_of_interest_investment: Optional[float] = None # Investment return rate (SIP/MF ONLY)
    banks_mentioned: List[str] = Field(default_factory=list)
    investments: List[str] = Field(default_factory=list)
    time_period: Optional[str] = None
    # Multi-loan structured data
    loans: List[LoanDetail] = Field(default_factory=list)
    all_loan_tenures: List[int] = Field(default_factory=list)
    all_interest_rates_loan: List[float] = Field(default_factory=list)

    @field_validator(
        "income", "emi_amount", "sip_amount", "loan_amount", "total_loan_exposure",
        "loan_tenure_years", "rate_of_interest_loan", "rate_of_interest_investment",
        mode="before",
    )
    @classmethod
    def clean_numbers(cls, v):
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return v
        if isinstance(v, str):
            cleaned = re.sub(r"[^\d.]", "", v)
            if not cleaned:
                return 0
            try:
                return float(cleaned) if "." in cleaned else int(cleaned)
            except ValueError:
                return 0
        return v


class PredictResponse(BaseModel):
    transcription: str = ""
    language: str = "english"
    is_financial: bool = False
    entities: EntitiesModel = Field(default_factory=EntitiesModel)
    estimated_income: Optional[int] = 0
    summary: str = ""
    user_emotion: str = "neutral"
    user_confidence: str = "medium"
    good_decisions: List[str] = Field(default_factory=list)
    sentiment: str = "neutral"
    risk_score: int = 0
    risk_level: str = "low"
    risk_explanation: str = ""
    financial_advice: List[str] = Field(default_factory=list)
    confidence_score: float = 0.0


def build_fallback_response() -> dict:
    return PredictResponse().model_dump()
