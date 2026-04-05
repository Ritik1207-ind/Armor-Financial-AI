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
      // Ensure createdAt exists
      const dateStr = conv.createdAt ? conv.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
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

    const entity_distribution = {};

    for (const inst of insights) {
      const dateStr = inst.createdAt ? inst.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      if (inst.confidence_score !== undefined) {
        confidence_trend.push({ date: dateStr, confidence: inst.confidence_score });
      }
      if (inst.entities && typeof inst.entities === 'object') {
        Object.entries(inst.entities).forEach(([key, value]) => {
          if (typeof value === 'number' && value > 0) {
            entity_distribution[key] = (entity_distribution[key] || 0) + value;
          }
        });
      }
    }

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
      entity_distribution: entity_distribution || {},
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
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

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
