const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const serverless = require('serverless-http');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./services_config/db');
const { logger, requestLogger } = require('./services_config/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security Middleware
app.use(helmet({ 
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({ 
  origin: process.env.FRONTEND_URL || '*', 
  credentials: true 
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use(requestLogger);

// Static Files (Note: Vercel serverless doesn't support persistent file storage)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/alumni', require('./routes/alumni'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/events', require('./routes/events'));
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/resume', require('./routes/resume'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'ok', 
    message: 'GEC Alumni API is running on Vercel',
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
});

// Root Route (to prevent 404 on the main domain)
app.get('/', (req, res) => {
  res.send('<h1>🚀 GEC Alumni API is Live</h1><p>Visit <a href="/api/health">/api/health</a> to check status.</p>');
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Database Initialization helper
let isDbInitialized = false;
const initDbOnce = async () => {
  if (!isDbInitialized) {
    try {
      await initializeDatabase();
      isDbInitialized = true;
      console.log('Database initialized in serverless function');
    } catch (err) {
      console.error('Database initialization failed in serverless function:', err);
    }
  }
};

// Wrap the handler to ensure DB is initialized
const handler = serverless(app);

module.exports = async (req, res) => {
  await initDbOnce();
  return await handler(req, res);
};
