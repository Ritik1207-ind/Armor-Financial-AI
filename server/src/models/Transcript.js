const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
  conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  original_text: { type: String },
  edited_text: { type: String },
  language: { type: String },
  confidence: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Transcript', transcriptSchema);
