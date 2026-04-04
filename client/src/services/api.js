// MOCK API Service

// Generate random insights for Dashboard
export const fetchDashboardData = async () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                total_conversations: 12,
                risk_trend: [
                    { date: '2026-04-01', risk_score: 45 },
                    { date: '2026-04-02', risk_score: 55 },
                    { date: '2026-04-03', risk_score: 50 },
                    { date: '2026-04-04', risk_score: 65 }
                ],
                confidence_trend: [
                    { date: '2026-04-01', confidence: 0.82 },
                    { date: '2026-04-02', confidence: 0.88 },
                    { date: '2026-04-03', confidence: 0.90 },
                    { date: '2026-04-04', confidence: 0.91 }
                ],
                entity_distribution: { emi: 5, loan: 4, sip: 3 },
                sentiment_distribution: { positive: 4, neutral: 6, negative: 2 },
                recent_conversations: [
                    { id: '1', date: '2026-04-04', snippet: 'SIP badha dete hain...', risk_level: 'low', is_financial: true },
                    { id: '2', date: '2026-04-03', snippet: 'Loan lena safe hai kya?', risk_level: 'high', is_financial: true }
                ]
            });
        }, 800);
    });
};

// Mock analyzing conversation
export const analyzeConversation = async (payload) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                version: "v1",
                conversation_id: "demo-" + Math.floor(Math.random()*10000),
                transcription: payload.text || "(Mock transcribed audio)",
                summary: "Discussed taking a new loan and adjusting current expenditures.",
                entities: { emis: [{ amount: 15000, duration_months: 12 }] },
                sentiment: "uncertain",
                risk_score: 65,
                risk_level: "medium",
                status: "processed",
                created_at: new Date().toISOString()
            });
        }, 2000); // simulate 2 seconds of AI processing
    });
};
