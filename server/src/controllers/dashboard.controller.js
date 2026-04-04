const Conversation = require('../models/Conversation');
const Insight = require('../models/Insight');

exports.getDashboard = async (req, res, next) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const conversations = await Conversation.find({ user_id }).sort({ createdAt: 1 });
    
    const risk_trend = [];
    const confidence_trend = [];
    const sentiment_distribution = { positive: 0, neutral: 0, negative: 0 };
    let total_conversations = conversations.length;
    
    for (const conv of conversations) {
      const dateStr = conv.createdAt.toISOString().split('T')[0];
      
      if (conv.risk_score) {
        risk_trend.push({ date: dateStr, risk_score: conv.risk_score });
      }
      
      if (conv.sentiment) {
        if (conv.sentiment.includes('positive') || conv.sentiment === 'good') sentiment_distribution.positive++;
        else if (conv.sentiment.includes('negative') || conv.sentiment === 'bad') sentiment_distribution.negative++;
        else sentiment_distribution.neutral++;
      }
    }

    const insights = await Insight.find({ conversation_id: { $in: conversations.map(c => c._id) } });

    const entity_distribution = { emi: 0, loan: 0, sip: 0 };

    for (const inst of insights) {
      if (inst.confidence_score) {
        confidence_trend.push({ date: inst.createdAt.toISOString().split('T')[0], confidence: inst.confidence_score });
      }
      if (inst.entities) {
        if (inst.entities.emis) entity_distribution.emi += inst.entities.emis.length;
        if (inst.entities.loans) entity_distribution.loan += inst.entities.loans.length;
        if (inst.entities.sips) entity_distribution.sip += inst.entities.sips.length;
      }
    }

    res.json({
      total_conversations,
      risk_trend,
      confidence_trend,
      entity_distribution,
      sentiment_distribution,
      recent_conversations: conversations.slice(-5).reverse(),
      key_insights: insights.slice(-5)
    });
  } catch (error) {
    next(error);
  }
};
