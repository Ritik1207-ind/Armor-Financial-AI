const logger = require('../utils/logger');

const processWithGroq = async (text) => {
  logger.info("Calling Groq LLM API as primary inference...");
  return null;
};

const processWithGemini = async (text) => {
  logger.info("Calling Gemini API as fallback inference...");
  return null;
};

const extractInsights = async (text) => {
  try {
    let result = await processWithGroq(text);
    if (!result) result = await processWithGemini(text);
    return result;
  } catch (error) {
    logger.error("LLM Extraction failed", error);
    throw error;
  }
};

module.exports = {
  extractInsights,
  processWithGroq,
  processWithGemini
};
