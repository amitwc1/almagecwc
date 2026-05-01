const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../services_config/db');

const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');
require('dotenv').config();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
  const { name, email: rawEmail, password, role } = req.body;
  const email = rawEmail.toLowerCase().trim();

  // Check for existing user
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);
  const userRole = role || 'student';

  // Insert user
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hashedPassword, userRole]
  );

  const userId = result.insertId;

  // Create base profile (Required for all users)
  await pool.query('INSERT INTO profiles (user_id) VALUES (?)', [userId]);

  // Create alumni profile if role is alumni
  if (userRole === 'alumni') {
    await pool.query('INSERT INTO alumni_profiles (user_id) VALUES (?)', [userId]);
  }

  // Award "Newcomer" badge
  const [newcomerBadge] = await pool.query('SELECT id FROM badges WHERE name = ?', ['Newcomer']);
  if (newcomerBadge.length > 0) {
    await pool.query('INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)', [result.insertId, newcomerBadge[0].id]);
  }

  // Create welcome notification
  await pool.query(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
    [result.insertId, 'system', 'Welcome to GEC Alumni!', `Welcome aboard, ${name}! Complete your profile to get started.`, '/dashboard']
  );

  // Send welcome email (non-blocking)
  emailService.sendWelcome({ name, email }).catch(() => {});

  // Generate token
  const token = jwt.sign(
    { id: result.insertId, email, role: userRole },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    token,
    user: { id: result.insertId, name, email, role: userRole }
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email: rawEmail, password } = req.body;
  const email = rawEmail.toLowerCase().trim();

  const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (users.length === 0) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const user = users[0];

  // Check if user is banned
  if (user.status === 'banned') {
    throw new ApiError(403, 'Your account has been suspended. Contact admin for assistance.');
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Update online status
  await pool.query('UPDATE users SET is_online = TRUE, last_seen = NOW() WHERE id = ?', [user.id]);

  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status }
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
  const [users] = await pool.query(
    'SELECT id, name, email, role, status, avatar_url, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (users.length === 0) {
    throw new ApiError(404, 'User not found');
  }

  // Get badges
  const [badges] = await pool.query(`
    SELECT b.name, b.description, b.icon, b.points, ub.awarded_at
    FROM user_badges ub JOIN badges b ON ub.badge_id = b.id
    WHERE ub.user_id = ?
    ORDER BY ub.awarded_at DESC
  `, [req.user.id]);

  // Get unread notification count
  const [unreadCount] = await pool.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
    [req.user.id]
  );

  res.json({
    success: true,
    ...users[0],
    badges,
    unreadNotifications: unreadCount[0].count
  });
});
