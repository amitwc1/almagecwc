const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./services_config/db');
const { logger, requestLogger } = require('./services_config/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// 1. HARDCODED CORS (TOP PRIORITY)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// 2. SECURITY (HELMET DISABLED FOR DEBUGGING)
// app.use(helmet(...));

// 3. DATABASE INIT MIDDLEWARE
app.use(async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (err) {
    console.error('DB Init Error:', err);
    res.status(500).json({ success: false, message: 'Database Connection Error' });
  }
});

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
  res.json({ success: true, status: 'ok' });
});

// Root Route
app.get('/', (req, res) => {
  res.send('🚀 API is Live');
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
