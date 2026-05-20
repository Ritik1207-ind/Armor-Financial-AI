const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');

const AI_URL = env.AI_SERVICE_URL;

// ─── Built-in Fallback AI (used when Python AI Service is down) ──────────────

const FINANCIAL_KEYWORDS = [
  'emi', 'sip', 'loan', 'credit', 'debt', 'interest', 'investment',
  'salary', 'income', 'insurance', 'mutual fund', 'stock', 'budget',
  'lakh', 'crore', 'rupee', 'rs', '₹', 'bank', 'fd', 'rd',
  'tax', 'gst', 'savings', 'expense', 'profit', 'loss', 'rent',
  'payment', 'installment', 'premium', 'return', 'portfolio'
];

function extractAmounts(text) {
  const amounts = [];
  const patterns = [
    /(?:rs\.?|₹|inr)\s*([\d,]+(?:\.\d+)?)/gi,
    /([\d,]+(?:\.\d+)?)\s*(?:lakh|lac|lakhs)/gi,
    /([\d,]+(?:\.\d+)?)\s*(?:crore|cr)/gi,
    /([\d,]+(?:\.\d+)?)\s*(?:rupees|rupee)/gi,
    /\b(\d{4,})\b/g
  ];
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(text)) !== null) {
      const num = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) amounts.push(num);
    }
  }
  return [...new Set(amounts)];
}

function generateFallbackResponse(inputType, data) {
  const text = inputType === 'text' ? data : '(audio input — transcription unavailable in fallback mode)';
  const lowered = text.toLowerCase();

  const hits = FINANCIAL_KEYWORDS.filter(kw => lowered.includes(kw));
  const isFinancial = hits.length > 0;
  const confidence = Math.min(0.35 + (hits.length * 0.12), 0.98);
  const amounts = extractAmounts(text);

  const emis = [];
  const sips = [];
  const loans = [];
  if (lowered.includes('emi') && amounts.length > 0) {
    emis.push({ amount: amounts[0], duration_months: 12 });
  }
  if (lowered.includes('sip') && amounts.length > 0) {
    sips.push({ amount: amounts[amounts.length > 1 ? 1 : 0], frequency: 'monthly' });
  }
  if (lowered.includes('loan') && amounts.length > 0) {
    loans.push({ amount: amounts[0], type: 'personal' });
  }

  let riskScore = 25;
  let riskLevel = 'low';
  if (lowered.includes('loan') || lowered.includes('debt') || lowered.includes('credit')) {
    riskScore = 65;
    riskLevel = 'medium';
  }
  if (amounts.some(a => a > 500000)) {
    riskScore = 80;
    riskLevel = 'high';
  }

  const advice = [];
  if (emis.length) advice.push(`Review the EMI of ₹${emis[0].amount} against your monthly budget.`);
  if (sips.length) advice.push(`Confirm the SIP of ₹${sips[0].amount}/month aligns with your goals.`);
  if (loans.length) advice.push(`Compare interest rates before finalizing the loan of ₹${loans[0].amount}.`);
  if (riskLevel === 'high') advice.push('Consider building an emergency fund before large commitments.');
  if (!advice.length) advice.push('Review the financial details and validate numbers before acting.');

  const sentences = text.replace(/\n/g, ' ').split(/[.!?]/).filter(s => s.trim());
  const summary = sentences.length > 2
    ? sentences.slice(0, 2).join('. ').trim() + '.'
    : text.substring(0, 220).trim();

  return {
    version: 'v1',
    transcription: text,
    summary: summary,
    language: 'auto',
    confidence_score: isFinancial ? confidence : 0.1,
    is_financial: isFinancial,
    estimated_income: 0,
    risk_score: riskScore,
    risk_level: riskLevel,
    risk_explanation: isFinancial
      ? `Detected financial keywords: ${hits.join(', ')}. Risk assessed based on amounts and context.`
      : 'No financial context detected in this conversation.',
    sentiment: 'neutral',
    user_emotion: 'neutral',
    user_confidence: 'medium',
    entities: { emis, sips, loans },
    good_decisions: isFinancial ? ['Discussing finances openly is a positive step.'] : [],
    financial_advice: advice
  };
}

// ─── Main predict function with automatic fallback ───────────────────────────

const predict = async (inputType, data, languageHint = 'auto', filename = null) => {
  // Try external AI Service first
  try {
    const payload = {
      input_type: inputType,
      data: data,
      language_hint: languageHint,
      filename: filename,
      version: 'v1'
    };

    const response = await axios.post(`${AI_URL}/predict`, payload, {
      timeout: 30000
    });

    logger.info('AI Service responded successfully');
    return response.data;
  } catch (error) {
    logger.warn(`External AI Service unavailable (${error.message}), using built-in fallback`);
  }

  // Fallback: generate response locally
  return generateFallbackResponse(inputType, data);
};

module.exports = { predict };
