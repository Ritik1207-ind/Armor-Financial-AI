const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');

const AI_URL = env.AI_SERVICE_URL;

const predict = async (inputType, data, languageHint = 'auto', filename = null) => {
  try {
    const payload = {
      input_type: inputType,
      data: data,
      language_hint: languageHint,
      filename: filename,
      version: 'v1'
    };

    const response = await axios.post(`${AI_URL}/predict`, payload, {
      timeout: 90000
    });

    return response.data;
  } catch (error) {
    logger.error('Failed to call AI Service /predict API', error);
    throw new Error('AI_PROCESSING_FAILED');
  }
};

module.exports = { predict };
