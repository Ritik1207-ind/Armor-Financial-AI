const express = require('express');
const app = express();
app.use(express.json());

app.post('/predict', (req, res) => {
    console.log('Mock AI received request:', req.body.input_type);
    res.json({
        version: "v1",
        transcription: req.body.input_type === 'text' ? req.body.data : "Mock transcribed audio",
        summary: "This is a real-time recorded financial insight summary.",
        language: "en",
        confidence_score: 0.95,
        is_financial: true,
        estimated_income: 150000,
        risk_score: 42,
        risk_level: "low",
        risk_explanation: "The user is asking about manageing EMIs comfortably.",
        sentiment: "positive",
        entities: {
            emis: [{ amount: 5000, duration_months: 24 }],
            sips: [{ amount: 2000, frequency: "monthly" }],
            loans: []
        },
        financial_advice: ["Review your budget", "Ensure emergency fund is ready"]
    });
});

app.listen(8000, () => console.log('Mock AI Service running on port 8000'));
