const fs = require('fs');
const Conversation = require('../models/Conversation');
const Transcript = require('../models/Transcript');
const Insight = require('../models/Insight');
const aiService = require('../services/ai.service');
const { sanitizeNum } = require('../utils/sanitize');
const logger = require('../utils/logger');
const { CONVERSATION_STATUS } = require('../constants/enums');

const fallbackParser = (rawText) => {
  try {
    const jsonStr = rawText.match(/\{[\s\S]*\}$/)[0];
    return JSON.parse(jsonStr);
  } catch (err) {
    logger.error('Fallback parser failed', err);
    throw new Error('Could not parse AI response into JSON');
  }
};

const safeJsonParse = (response) => {
  try {
    return JSON.parse(response);
  } catch (err) {
    return fallbackParser(response);
  }
};

exports.analyzeConversation = async (req, res, next) => {
  const { input_type, text, language_hint = 'auto' } = req.body;
  const user_id = req.user.id;

  if (!input_type) {
    return res.status(400).json({ error: 'Missing required fields user_id or input_type' });
  }

  let audioUrl = null;
  let dataForAi = null;
  
  if (input_type === 'text') {
    if (!text) {
      return res.status(400).json({ error: 'text is required when input_type is text' });
    }
    dataForAi = text;
  } else if (input_type === 'audio') {
    if (!req.file) {
      return res.status(400).json({ error: 'audio_file is required when input_type is audio' });
    }
    audioUrl = req.file.path;
    const fileBuffer = fs.readFileSync(audioUrl);
    dataForAi = fileBuffer.toString('base64');
  } else {
    return res.status(400).json({ error: 'invalid input_type' });
  }

  let conversation;
  try {
    conversation = await Conversation.create({
      user_id,
      input_type,
      audio_url: audioUrl,
      status: CONVERSATION_STATUS.PROCESSING
    });
  } catch (error) {
    return next(error);
  }

  try {
    const originalFilename = req.file ? req.file.originalname : null;
    const rawAiResponse = await aiService.predict(input_type, dataForAi, language_hint, originalFilename);
    const parsedData = typeof rawAiResponse === 'string' ? safeJsonParse(rawAiResponse) : rawAiResponse;

    const transcript = await Transcript.create({
      conversation_id: conversation._id,
      original_text: parsedData.transcription || '',
      edited_text: parsedData.transcription || '',
      language: parsedData.language,
      confidence: parsedData.confidence_score
    });

    const insights = await Insight.create({
      conversation_id: conversation._id,
      summary: parsedData.summary,
      entities: parsedData.entities || {},
      good_decisions: parsedData.good_decisions || [],
      financial_advice: parsedData.financial_advice || [],
      confidence_score: parsedData.confidence_score
    });

    conversation.status = CONVERSATION_STATUS.PROCESSED;
    conversation.language_detected = parsedData.language;
    conversation.is_financial = parsedData.is_financial;
    conversation.estimated_income = sanitizeNum(parsedData.estimated_income);
    conversation.risk_score = sanitizeNum(parsedData.risk_score);
    conversation.risk_level = parsedData.risk_level;
    conversation.risk_explanation = parsedData.risk_explanation;
    conversation.sentiment = parsedData.sentiment;
    conversation.user_emotion = parsedData.user_emotion;
    conversation.user_confidence = parsedData.user_confidence;
    
    await conversation.save();

    res.json({
      version: 'v1',
      conversation_id: conversation._id,
      transcription: transcript.original_text,
      summary: insights.summary,
      entities: insights.entities,
      sentiment: conversation.sentiment,
      user_emotion: conversation.user_emotion,
      user_confidence: conversation.user_confidence,
      is_financial: conversation.is_financial,
      good_decisions: insights.good_decisions,
      risk_score: conversation.risk_score,
      risk_level: conversation.risk_level,
      status: conversation.status,
      created_at: conversation.createdAt,
      financial_advice: insights.financial_advice
    });

  } catch (error) {
    logger.error('AI Processing Workflow Failed', error);
    if (conversation) {
      conversation.status = CONVERSATION_STATUS.FAILED;
      conversation.error_reason = error.message;
      await conversation.save();
    }
    
    return res.status(500).json({
      conversation_id: conversation ? conversation._id : null,
      status: CONVERSATION_STATUS.FAILED,
      error: 'AI_PROCESSING_FAILED',
      message: 'Try again later'
    });
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const conversations = await Conversation.find({ user_id }).sort({ createdAt: -1 });
    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ error: 'Not found' });

    const transcript = await Transcript.findOne({ conversation_id: id });
    const insight = await Insight.findOne({ conversation_id: id });

    res.json({
      conversation,
      transcript,
      insight
    });
  } catch (error) {
    next(error);
  }
};

exports.editTranscript = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { edited_text } = req.body;
    
    if (!edited_text) return res.status(400).json({ error: 'edited_text is required' });

    const transcript = await Transcript.findOneAndUpdate(
      { conversation_id: id },
      { edited_text },
      { new: true }
    );

    if (!transcript) return res.status(404).json({ error: 'Transcript not found' });

    res.json(transcript);
  } catch (error) {
    next(error);
  }
};

exports.deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const conversation = await Conversation.findOne({ _id: id, user_id });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized' });
    }

    await Insight.deleteOne({ conversation_id: id });
    await Transcript.deleteOne({ conversation_id: id });
    await Conversation.deleteOne({ _id: id });

    res.json({ message: 'Conversation deleted successfully', id });
  } catch (error) {
    next(error);
  }
};
