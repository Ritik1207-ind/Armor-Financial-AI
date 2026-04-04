const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({ level: 'INFO', message, ...meta, timestamp: new Date().toISOString() }));
  },
  error: (message, error = {}, meta = {}) => {
    const errorDetails = error instanceof Error ? { errorMsg: error.message, stack: error.stack } : { error };
    console.error(JSON.stringify({ level: 'ERROR', message, ...errorDetails, ...meta, timestamp: new Date().toISOString() }));
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({ level: 'WARN', message, ...meta, timestamp: new Date().toISOString() }));
  }
};

module.exports = logger;
