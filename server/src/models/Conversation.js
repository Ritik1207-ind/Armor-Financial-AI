const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  input_type: { type: String, enum: ['audio', 'text'], required: true },
  audio_url: { type: String },
  language_detected: { type: String },
  is_financial: { type: Boolean },
  estimated_income: { type: Number },
  risk_score: { type: Number },
  risk_level: { type: String, enum: ['low', 'medium', 'high'] },
  risk_explanation: { type: String },
  sentiment: { type: String },
  status: { type: String, enum: ['processing', 'processed', 'failed'], default: 'processing' },
  error_reason: { type: String },
  version: { type: String, default: 'v1' },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
