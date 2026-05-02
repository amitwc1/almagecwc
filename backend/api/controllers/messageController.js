const { pool } = require('../services_config/db');

const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { createNotification } = require('./notificationController');
const multer = require('multer');
const { messageStorage } = require('../services_config/cloudinary');

// Multer Config using Cloudinary
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

exports.upload = multer({
  storage: messageStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Check if two users have a messaging relationship
 * (connected OR accepted mentorship)
 */
const canMessage = async (userId1, userId2) => {
  // Check connections
  const [connection] = await pool.query(
    `SELECT id FROM connections 
     WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) 
     AND status = 'accepted'`,
    [userId1, userId2, userId2, userId1]
  );
  if (connection.length > 0) return true;

  // Check mentorship
  const [mentorship] = await pool.query(
    `SELECT id FROM mentorship_requests 
     WHERE ((student_id = ? AND mentor_id = ?) OR (student_id = ? AND mentor_id = ?)) 
     AND status = 'accepted'`,
    [userId1, userId2, userId2, userId1]
  );
  if (mentorship.length > 0) return true;

  return false;
};

/**
 * Get all conversations for current user
 * GET /api/messages/conversations
 */
exports.getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  console.log(`[Chat] Fetching conversations for user ${userId}`);

  try {
    const [conversations] = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.role, u.is_online, u.last_seen, u.avatar_url,
        COALESCE(ap.job_title, p.department, '') as job_title,
        COALESCE(ap.company, '') as company,
        (SELECT content FROM messages 
         WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) 
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT message_type FROM messages 
         WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) 
         ORDER BY created_at DESC LIMIT 1) as last_message_type,
        (SELECT created_at FROM messages 
         WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) 
         ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM messages 
         WHERE sender_id = u.id AND receiver_id = ? AND is_read = FALSE) as unread_count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
      WHERE u.id IN (
        SELECT DISTINCT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
        FROM messages WHERE sender_id = ? OR receiver_id = ?
      ) 
      ORDER BY last_message_at DESC
    `, [userId, userId, userId, userId, userId, userId, userId, userId, userId, userId]);

    console.log(`[Chat] Found ${conversations.length} conversations`);
    res.json({ success: true, data: conversations });
  } catch (err) {
    console.error('[Chat Error] getConversations:', err.message);
    throw err;
  }
});


/**
 * Get chat history with a specific user
 * GET /api/messages/:userId
 */
exports.getMessages = asyncHandler(async (req, res) => {
  const myId = req.user.id;
  const otherId = parseInt(req.params.userId);
  
  console.log(`[Chat] Loading history: User ${myId} <-> ${otherId}`);

  if (isNaN(otherId)) {
    throw new ApiError(400, 'Invalid user ID');
  }

  // Mark messages from the other user as read
  await pool.query(
    'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?',
    [otherId, myId]
  );

  // Fetch messages - using the exact query logic requested by the user
  const [messages] = await pool.query(`
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) 
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `, [myId, otherId, otherId, myId]);

  console.log(`[Chat] Found ${messages.length} messages`);
  res.json({ success: true, data: messages });
});


/**
 * Send a message
 * POST /api/messages/send
 */
exports.sendMessage = asyncHandler(async (req, res) => {
  const { receiver_id, content } = req.body;
  const senderId = req.user.id;
  const file = req.file;

  if (!receiver_id) throw new ApiError(400, 'Receiver ID is required');
  if (parseInt(receiver_id) === senderId) throw new ApiError(400, 'Cannot send message to yourself');

  // Verify receiver exists
  const [receiver] = await pool.query('SELECT id, name FROM users WHERE id = ?', [receiver_id]);
  if (receiver.length === 0) throw new ApiError(404, 'User not found');

  // Verify messaging relationship
  const allowed = await canMessage(senderId, parseInt(receiver_id));
  if (!allowed) throw new ApiError(403, 'You must be connected or have an accepted mentorship to message this user');

  let message_type = 'text';
  let file_url = null;
  let file_name = null;

  if (file) {
    if (file.mimetype.startsWith('image/')) message_type = 'image';
    else if (file.mimetype === 'application/pdf') message_type = 'pdf';
    else if (file.mimetype.startsWith('audio/')) message_type = 'audio';
    
    file_url = file.path;
    file_name = file.originalname;
  } else if (!content || !content.trim()) {
    throw new ApiError(400, 'Message content or file is required');
  }

  const [result] = await pool.query(
    'INSERT INTO messages (sender_id, receiver_id, content, message_type, file_url, file_name) VALUES (?, ?, ?, ?, ?, ?)',
    [senderId, receiver_id, content ? content.trim() : null, message_type, file_url, file_name]
  );

  // Fetch sender name
  const [sender] = await pool.query('SELECT name FROM users WHERE id = ?', [senderId]);

  // Create notification
  await createNotification(
    receiver_id,
    'message',
    'New Message',
    `${sender[0].name} sent you a ${message_type === 'text' ? 'message' : message_type}`,
    senderId
  );

  const messageData = {
    id: result.insertId,
    sender_id: senderId,
    receiver_id: parseInt(receiver_id),
    content: content ? content.trim() : null,
    message_type,
    file_url,
    file_name,
    sender_name: sender[0].name,
    is_read: false,
    created_at: new Date().toISOString()
  };

  // Real-time message delivery
  const io = req.app.get('io');
  const onlineUsers = req.app.get('onlineUsers');
  if (io && onlineUsers) {
    const receiverSocket = onlineUsers.get(parseInt(receiver_id));
    if (receiverSocket) {
      io.to(receiverSocket).emit('new_message', messageData);
    }
  }

  res.status(201).json({
    success: true,
    data: messageData
  });
});

/**
 * Mark messages as read
 * PUT /api/messages/read
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  const { sender_id } = req.body;
  if (!sender_id) throw new ApiError(400, 'Sender ID is required');

  await pool.query(
    'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?',
    [sender_id, req.user.id]
  );

  res.json({ success: true, message: 'Messages marked as read' });
});

/**
 * Get messageable users (connected + mentored users)
 * GET /api/messages/contacts
 */
exports.getContacts = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [contacts] = await pool.query(`
    SELECT DISTINCT u.id, u.name, u.email, u.role, u.is_online, u.last_seen, u.avatar_url,
      COALESCE(ap.job_title, p.department, '') as job_title, COALESCE(ap.company, '') as company
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
    WHERE u.id != ? AND (
      u.id IN (
        SELECT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
        FROM connections WHERE (sender_id = ? OR receiver_id = ?) AND status = 'accepted'
      )
      OR u.id IN (
        SELECT CASE WHEN student_id = ? THEN mentor_id ELSE student_id END
        FROM mentorship_requests WHERE (student_id = ? OR mentor_id = ?) AND status = 'accepted'
      )
    )
    ORDER BY u.name ASC


  `, [userId, userId, userId, userId, userId, userId, userId]);

  res.json({ success: true, data: contacts });
});
