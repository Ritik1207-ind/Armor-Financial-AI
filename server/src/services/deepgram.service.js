const logger = require('../utils/logger');

const transcribeAudio = async (audioBuffer) => {
  logger.info("Calling Deepgram for STT...");
  return "Mock generated transcript from Deepgram";
};

module.exports = { transcribeAudio };
