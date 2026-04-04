const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Global handlers for unexpected occurrences
process.on('uncaughtException', err => {
  logger.error('Uncaught Exception', err);
});
process.on('unhandledRejection', err => {
  logger.error('Unhandled Rejection', err);
});

// Database Connection
connectDB().then(() => {
  const server = app.listen(env.PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${env.PORT}`);
  });
}).catch((error) => {
  logger.error('Failed to initialize server', error);
  process.exit(1);
});
