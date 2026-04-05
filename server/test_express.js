const axios = require('axios');

const text = "Main ek 24 saal ka software engineer hoon jo Infosys me kaam karta hoon. Meri monthly salary ₹65,000 hai (in-hand).\n\nMere upar ek home loan chal raha hai jo maine State Bank of India se liya tha ₹30,00,000 ka, interest rate 8.7% annual hai aur tenure 20 saal ka hai.\nIska EMI ₹26,500 per month jaata hai.\n\nIske alawa maine ek personal loan bhi liya tha ₹3,00,000 ka from HDFC Bank, jiska interest rate 13% hai aur EMI ₹7,200 per month hai (remaining tenure 3 saal).";

async function test() {
    try {
        const res = await axios.post('http://localhost:5000/api/conversation/analyze', {
            user_id: 'test_user_123',
            input_type: 'text',
            text: text
        });
        const fs = require('fs');
        fs.writeFileSync('express_out.json', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log("CRASHED", e.response ? e.response.data : e.message);
    }
}
test();
