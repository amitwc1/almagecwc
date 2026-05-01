const { pool } = require('../services_config/db');

const { ApiError, asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const [notifications] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [req.user.id]
  );

  const [unreadCount] = await pool.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
    [req.user.id]
  );

  res.json({
    success: true,
    data: notifications,
    unreadCount: unreadCount[0].count
  });
});

/**
 * @route   PUT /api/notifications/read/:id
 * @desc    Mark notification as read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [result] = await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Notification not found');
  }

  res.json({ success: true, message: 'Notification marked as read' });
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await pool.query(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
    [req.user.id]
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});

/**
 * Internal helper to create a notification
 */
exports.createNotification = async (userId, type, title, message, referenceId = null) => {
  try {
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, reference_id) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, message, referenceId]
    );

    // If socket.io is available, push notification
    const io = require('../server').io; // Assuming io is exported from server.js
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', {
        id: result.insertId,
        type,
        title,
        message,
        reference_id: referenceId,
        is_read: false,
        created_at: new Date()
      });
    }

    return result.insertId;
  } catch (err) {
    console.error('[Notification Error]', err);
  }
};
