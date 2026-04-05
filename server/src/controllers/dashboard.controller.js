const Conversation = require('../models/Conversation');
const Insight = require('../models/Insight');

exports.getDashboard = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const conversations = await Conversation.find({ user_id }).sort({ createdAt: 1 });
    
    const risk_trend = [];
    const confidence_trend = [];
    const income_trend = [];
    const sentiment_distribution = { positive: 0, neutral: 0, negative: 0 };
    let total_conversations = conversations.length;
    
    for (const conv of conversations) {
      // Ensure createdAt exists
      const d = conv.createdAt ? new Date(conv.createdAt) : new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      
      // Push risk score (even if 0)
      if (conv.risk_score !== undefined) {
        risk_trend.push({ date: dateStr, risk_score: conv.risk_score });
      }
      
      if (conv.sentiment) {
        const s = conv.sentiment.toLowerCase();
        if (s.includes('positive') || s === 'good') sentiment_distribution.positive++;
        else if (s.includes('negative') || s === 'bad') sentiment_distribution.negative++;
        else sentiment_distribution.neutral++;
      } else {
        sentiment_distribution.neutral++;
      }
    }

    const convIds = conversations.map(c => c._id);
    const insights = await Insight.find({ conversation_id: { $in: convIds } });

    const sip_trend = [];
    const loan_trend = [];
    const emi_trend = [];

    const SIP_KEYWORDS = ['sip', 'mutual', 'investment', 'fund', 'rd', 'fd'];
    const LOAN_KEYWORDS = ['loan', 'debt', 'mortgage', 'borrow', 'principal'];
    const EMI_KEYWORDS = ['emi', 'installment'];
    const INCOME_KEYWORDS = ['income', 'salary', 'profit', 'revenue', 'earning', 'pay'];
    const EXCLUDE_KEYWORDS = ['month', 'year', 'tenure', 'duration', 'time', 'age', 'percent', 'percentage', 'rate'];

    const portfolio_trends = [];

    for (const inst of insights) {
      const d = inst.createdAt ? new Date(inst.createdAt) : new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      if (inst.confidence_score !== undefined) {
        confidence_trend.push({ date: dateStr, confidence: inst.confidence_score });
      }

      let overrides = {};
      let sip_base = 0;
      let loan_base = 0;
      let emi_base = 0;
      let income_base = 0;
      
      let sip_total_val = null;
      let loan_total_val = null;
      let emi_total_val = null;
      let income_total_val = null;

      if (inst.entities && typeof inst.entities === 'object') {
        Object.entries(inst.entities).forEach(([key, value]) => {
          const lowerKey = key.toLowerCase();
          
          if (lowerKey === '__override_sip') { overrides.sip = value; return; }
          if (lowerKey === '__override_loan') { overrides.loan = value; return; }
          if (lowerKey === '__override_emi') { overrides.emi = value; return; }
          if (lowerKey === '__override_income') { overrides.income = value; return; }

          if (typeof value === 'number' && value > 0) {
            let exclude = false;
            for (const word of EXCLUDE_KEYWORDS) {
              if (lowerKey.includes(word) && !lowerKey.includes('income')) exclude = true;
            }
            if (exclude) return;

            if (INCOME_KEYWORDS.some(w => lowerKey.includes(w))) {
                if (lowerKey.includes('total')) income_total_val = value;
                else income_base += value;
            } else if (EMI_KEYWORDS.some(w => lowerKey.includes(w))) {
                if (lowerKey.includes('total')) emi_total_val = value;
                else emi_base += value;
            } else if (LOAN_KEYWORDS.some(w => lowerKey.includes(w))) {
                if (lowerKey.includes('total')) loan_total_val = value;
                else loan_base += value;
            } else if (SIP_KEYWORDS.some(w => lowerKey.includes(w))) {
                if (lowerKey.includes('total')) sip_total_val = value;
                else sip_base += value;
            }
          }
        });
      }
      
      if (sip_total_val !== null) sip_base = sip_total_val;
      if (loan_total_val !== null) loan_base = loan_total_val;
      if (emi_total_val !== null) emi_base = emi_total_val;
      if (income_total_val !== null) income_base = income_total_val;

      const sip_total = overrides.sip !== undefined ? overrides.sip : sip_base;
      const loan_total = overrides.loan !== undefined ? overrides.loan : loan_base;
      const emi_total = overrides.emi !== undefined ? overrides.emi : emi_base;
      const income_total = overrides.income !== undefined ? overrides.income : income_base;

      if (sip_total > 0 || overrides.sip === 0) sip_trend.push({ date: dateStr, sip: sip_total });
      if (loan_total > 0 || overrides.loan === 0) loan_trend.push({ date: dateStr, loan: loan_total });
      if (emi_total > 0 || overrides.emi === 0) emi_trend.push({ date: dateStr, emi: emi_total });
      if (income_total > 0 || overrides.income === 0) income_trend.push({ date: dateStr, income: income_total });

      portfolio_trends.push({
         insight_id: inst._id.toString(),
         date: dateStr,
         sip: sip_total,
         loan: loan_total,
         emi: emi_total,
         income: income_total
      });
    }

    portfolio_trends.sort((a,b) => new Date(a.date) - new Date(b.date));

    // Map recent conversations to match frontend expectations (id and snippet)
    const recent = conversations.slice(-5).reverse().map(c => {
      try {
        const insight = insights.find(i => i.conversation_id && i.conversation_id.toString() === c._id.toString());
        return {
          id: c._id.toString(),
          _id: c._id, // Keep original too
          date: c.createdAt ? c.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          snippet: insight ? (insight.summary || "No summary available") : `Conversation about ${c.input_type || 'financials'}`,
          risk_level: c.risk_level || 'low',
          status: c.status || 'processed'
        };
      } catch (e) {
        return { id: c._id.toString(), snippet: 'Error loading details', date: '---', risk_level: 'low' };
      }
    });

    res.json({
      total_conversations: total_conversations || 0,
      risk_trend: risk_trend || [],
      confidence_trend: confidence_trend || [],
      income_trend: income_trend || [],
      sip_trend: sip_trend || [],
      loan_trend: loan_trend || [],
      emi_trend: emi_trend || [],
      portfolio_trends: portfolio_trends || [],
      sentiment_distribution: sentiment_distribution || { positive: 0, neutral: 0, negative: 0 },
      recent_conversations: recent || [],
      key_insights: insights.slice(-5) || []
    });
  } catch (error) {
    next(error);
  }
};

exports.clearDashboardData = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const conversations = await Conversation.find({ user_id });
    const convIds = conversations.map(c => c._id);

    const Transcript = require('../models/Transcript');
    
    await Insight.deleteMany({ conversation_id: { $in: convIds } });
    await Transcript.deleteMany({ conversation_id: { $in: convIds } });
    await Conversation.deleteMany({ user_id });

    res.json({ message: "Dashboard history successfully cleared." });
  } catch (error) {
    next(error);
  }
};
