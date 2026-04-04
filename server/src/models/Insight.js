const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  summary: { type: String },
  entities: {
    emis: [{ amount: Number, duration_months: Number }],
    sips: [mongoose.Schema.Types.Mixed],
    loans: [mongoose.Schema.Types.Mixed]
  },
  financial_advice: [String],
  confidence_score: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Insight', insightSchema);
