const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  summary: { type: String },
  entities: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  good_decisions: [String],
  financial_advice: [String],
  confidence_score: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Insight', insightSchema);
