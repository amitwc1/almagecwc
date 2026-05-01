const rateLimit = require('express-rate-limit');
const { logger } = require('../services_config/logger');


/**
 * Rate Limiter Factory
 * Creates a limiter based on environment and custom requirements
 */
const createLimiter = (options = {}) => {
  const isProd = process.env.NODE_ENV === 'production';
  
  return rateLimit({
    // Standard options
    windowMs: options.windowMs || 15 * 60 * 1000, // Default 15 minutes
    max: isProd ? (options.prodMax || 10) : (options.devMax || 100),
    
    // Response behavior
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    
    // Custom message
    message: {
      success: false,
      message: options.message || "Too many attempts. Please try again after some time."
    },
    
    // Logging and handling
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip} on route: ${req.originalUrl}`);
      res.status(429).json(options.message);
    },
    
    // Skip internal health checks or specific conditions
    skip: (req) => req.originalUrl === '/api/health' || (req.ip === '127.0.0.1' && !isProd),
    
    ...options.extra
  });
};

// Strict limiter for authentication (Login/Register)
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  prodMax: 10,
  devMax: 100,
  message: "Too many login attempts. Please wait a few minutes and try again."
});

// General limiter for other API routes
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  prodMax: 200,
  devMax: 1000,
  message: "Too many requests. Please slow down."
});

module.exports = { authLimiter, apiLimiter };
