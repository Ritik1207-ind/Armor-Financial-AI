const express = require('express');
const cors = require('cors');
const conversationRoutes = require('./routes/conversation.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const authRoutes = require('./routes/auth.routes');
const { protect } = require('./middleware/auth.middleware');
const errorHandler = require('./middleware/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup routes
app.use('/api/auth', authRoutes);
app.use('/api/conversation', protect, conversationRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error Handling Middleware should be the last middleware
app.use(errorHandler);

module.exports = app;
