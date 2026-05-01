const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Updated paths for restructured folders
const { initializeDatabase } = require('./api/services_config/db');
const { logger, requestLogger } = require('./api/services_config/logger');
const { notFound, errorHandler } = require('./api/middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ─────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }
});

module.exports.io = io; 

// Track online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('user_online', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.join(`user_${userId}`);
    io.emit('user_status', { userId, online: true });
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('user_status', { userId, online: false });
        break;
      }
    }
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

app.set('io', io);
app.set('onlineUsers', onlineUsers);

// ─── Middleware ───────────────────────────────────────────────────
app.use(helmet({ 
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ─── Static Files ─────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes (Updated paths) ──────────────────────────────────
app.use('/api/auth', require('./api/routes/auth'));
app.use('/api/alumni', require('./api/routes/alumni'));
app.use('/api/jobs', require('./api/routes/jobs'));
app.use('/api/events', require('./api/routes/events'));
app.use('/api/mentorship', require('./api/routes/mentorship'));
app.use('/api/admin', require('./api/routes/admin'));
app.use('/api/notifications', require('./api/routes/notifications'));
app.use('/api/messages', require('./api/routes/messages'));
app.use('/api/connections', require('./api/routes/connections'));
app.use('/api/profile', require('./api/routes/profileRoutes'));
app.use('/api/resume', require('./api/routes/resume'));

// ─── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', message: 'GEC Alumni API (Local) is running', uptime: process.uptime() });
});

app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initializeDatabase();
    server.listen(PORT, () => {
      logger.info(`🚀 Local Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    server.listen(PORT, () => {
      logger.warn(`Server running on port ${PORT} (without database)`);
    });
  }
};

startServer();
