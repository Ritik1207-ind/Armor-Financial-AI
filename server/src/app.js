const express = require('express');
const cors = require('cors');
const conversationRoutes = require('./routes/conversation.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup routes
app.use('/api/conversation', conversationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Handling Middleware should be the last middleware
app.use(errorHandler);

module.exports = app;
