const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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

// Improved Production CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://almagecwc-frontend.vercel.app', // Add your frontend domain here
  'https://almagecwc.vercel.app',
  'http://localhost:5173'
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`[CORS Check] Origin: ${origin}, Method: ${req.method}`);
  
  // Allow all origins for now to fix connection
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Explicitly handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

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

// Debug Logs for Environment Variables (Vercel Expert Tip)
console.log('--- Environment Check ---');
console.log('DB_HOST:', process.env.DB_HOST ? '✅ Set' : '❌ NOT SET');
console.log('DB_USER:', process.env.DB_USER ? '✅ Set' : '❌ NOT SET');
console.log('VERCEL:', process.env.VERCEL ? '✅ Yes' : '❌ No');
console.log('-------------------------');

// --- Vercel Native Handler ---
// Expert Tip: On Vercel, you don't need serverless-http. 
// Just exporting the express app is the most stable method.

// Database Initialization helper (Safe for Serverless)
let isDbInitialized = false;
const initDbOnce = async () => {
  if (isDbInitialized) return;
  try {
    console.log('🚀 Attempting DB initialization...');
    await initializeDatabase();
    isDbInitialized = true;
    console.log('✅ DB successfully connected');
  } catch (err) {
    console.error('❌ DB initialization failed:', err.message);
  }
};

// Main Vercel Entry Point
module.exports = async (req, res) => {
  console.log(`📡 Request: ${req.method} ${req.url}`);
  
  try {
    // 1. Ensure Database is ready
    await initDbOnce();
    
    // 2. Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error('💥 CRITICAL BOOT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Server Boot Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
