import asyncio
import traceback
from app.services.pipeline import analyze_financial_conversation
from app.schemas.response_schema import PredictResponse

text = """Main ek 24 saal ka software engineer hoon jo Infosys me kaam karta hoon. Meri monthly salary ₹65,000 hai (in-hand).
Mere upar ek home loan chal raha hai jo maine State Bank of India se liya tha ₹30,00,000 ka, interest rate 8.7% annual hai aur tenure 20 saal ka hai.
Iska EMI ₹26,500 per month jaata hai."""

async def main():
    try:
        result = await analyze_financial_conversation(text)
        print("Raw dict acquired!")
        resp = PredictResponse.model_validate(result)
        print("Validate success!")
    except Exception as e:
        print("CRASHED!")
        traceback.print_exc()

asyncio.run(main())
