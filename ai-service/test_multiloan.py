import requests
import json

text = """Main ek 24 saal ka software engineer hoon jo Infosys me kaam karta hoon. Meri monthly salary ₹65,000 hai (in-hand).

Mere upar ek home loan chal raha hai jo maine State Bank of India se liya tha ₹30,00,000 ka, interest rate 8.7% annual hai aur tenure 20 saal ka hai.
Iska EMI ₹26,500 per month jaata hai.

Iske alawa maine ek personal loan bhi liya tha ₹3,00,000 ka from HDFC Bank, jiska interest rate 13% hai aur EMI ₹7,200 per month hai (remaining tenure 3 saal).

Mere fixed monthly expenses kuch is type ke hain:

Rent + maintenance: ₹8,000
Food & groceries: ₹6,000
Travel & fuel: ₹3,500
Subscriptions (Netflix, Spotify etc): ₹1,000

Total expenses approx ₹18,500 ho jaate hain EMI ke alawa.

Investments ki baat karu to:

₹10,000 monthly SIP in equity mutual funds (via Zerodha)
₹3,000 SIP in ELSS (tax saving)
₹2,000 crypto me daal deta hoon (kabhi kabhi loss bhi hota hai 😅)

Mere paas ₹1,20,000 ka emergency fund hai savings account me.

Goals:

5 saal me ₹10 lakh ka corpus banana hai
10 saal me ek aur property leni hai

Concern:
Mujhe lagta hai ki mere upar loans thode zyada ho gaye hain aur savings utni fast grow nahi ho rahi jitni honi chahiye. Kabhi kabhi SIP skip bhi ho jata hai agar extra expense aa jaye.

Kya mujhe apna personal loan pehle close karna chahiye ya SIP continue rakhna chahiye? Aur kya meri financial planning sahi direction me hai?"""

import asyncio
from app.services.pipeline import analyze_financial_conversation

async def test():
    result = await analyze_financial_conversation(text)
    with open("test_out.json", "w") as f:
        json.dump(result, f, indent=2)

asyncio.run(test())
