const { pool } = require('../services_config/db');

const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { createNotification } = require('./notificationController');


/**
 * Send a connection request
 * POST /api/connections/send
 */
exports.sendConnectionRequest = asyncHandler(async (req, res) => {
  const { receiver_id } = req.body;
  const senderId = req.user.id;

  if (!receiver_id) throw new ApiError(400, 'Receiver ID is required');
  if (parseInt(receiver_id) === senderId) throw new ApiError(400, 'Cannot send connection request to yourself');

  // Check if receiver exists
  const [receiver] = await pool.query('SELECT id, name FROM users WHERE id = ?', [receiver_id]);
  if (receiver.length === 0) throw new ApiError(404, 'User not found');

  // Check for existing connection in either direction
  const [existing] = await pool.query(
    `SELECT id, status, sender_id FROM connections 
     WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`,
    [senderId, receiver_id, receiver_id, senderId]
  );

  if (existing.length > 0) {
    const conn = existing[0];
    if (conn.status === 'accepted') throw new ApiError(400, 'Already connected');
    if (conn.status === 'pending') throw new ApiError(400, 'Connection request already pending');
    // If rejected, allow re-sending by updating the existing record
    if (conn.status === 'rejected') {
      await pool.query(
        'UPDATE connections SET sender_id = ?, receiver_id = ?, status = "pending", updated_at = NOW() WHERE id = ?',
        [senderId, receiver_id, conn.id]
      );
      // Notify receiver
      const [sender] = await pool.query('SELECT name FROM users WHERE id = ?', [senderId]);
      await createNotification(
        receiver_id,
        'connection',
        'Connection Request',
        `${sender[0].name} wants to connect with you`,
        senderId
      );
      return res.status(200).json({ success: true, message: 'Connection request re-sent' });

    }
  }

  // Create new connection request
  const [result] = await pool.query(
    'INSERT INTO connections (sender_id, receiver_id) VALUES (?, ?)',
    [senderId, receiver_id]
  );

  // Notify receiver
  const [sender] = await pool.query('SELECT name FROM users WHERE id = ?', [senderId]);
  await createNotification(
    receiver_id,
    'connection',
    'Connection Request',
    `${sender[0].name} wants to connect with you`,
    senderId
  );

  res.status(201).json({ success: true, id: result.insertId, message: 'Connection request sent' });

});

/**
 * Respond to a connection request (accept/reject)
 * PUT /api/connections/respond
 */
exports.respondToConnection = asyncHandler(async (req, res) => {
  const { connection_id, status } = req.body;

  if (!connection_id) throw new ApiError(400, 'Connection ID is required');
  if (!['accepted', 'rejected'].includes(status)) throw new ApiError(400, 'Status must be "accepted" or "rejected"');

  const [request] = await pool.query('SELECT * FROM connections WHERE id = ?', [connection_id]);
  if (request.length === 0) throw new ApiError(404, 'Connection request not found');

  const conn = request[0];
  if (conn.receiver_id !== req.user.id) throw new ApiError(403, 'Only the receiver can respond to this request');
  if (conn.status !== 'pending') throw new ApiError(400, `Request already ${conn.status}`);

  await pool.query('UPDATE connections SET status = ?, updated_at = NOW() WHERE id = ?', [status, connection_id]);

  // Notify sender about response
  const [responder] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
  await createNotification(
    conn.sender_id,
    'connection',
    `Connection ${status}`,
    `${responder[0].name} ${status} your connection request`,
    req.user.id
  );

  // Real-time extra event if accepted
  if (status === 'accepted') {
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const senderSocket = onlineUsers.get(conn.sender_id);
    if (senderSocket) {
      io.to(senderSocket).emit('connection_accepted', { userId: req.user.id, name: responder[0].name });
    }
  }


  // Check Community Builder badge if accepted
  if (status === 'accepted') {
    const [count] = await pool.query(
      `SELECT COUNT(*) as c FROM connections 
       WHERE (sender_id = ? OR receiver_id = ?) AND status = 'accepted'`,
      [req.user.id, req.user.id]
    );
    if (count[0].c >= 10) {
      const [badge] = await pool.query('SELECT id FROM badges WHERE name = ?', ['Community Builder']);
      if (badge.length > 0) {
        await pool.query('INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)', [req.user.id, badge[0].id]);
      }
    }
  }

  res.json({ success: true, message: `Connection ${status}` });
});

/**
 * Get all connections for current user
 * GET /api/connections/list
 */
exports.getConnections = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status: filterStatus } = req.query;

  let query = `
    SELECT c.*, 
      s.name as sender_name, s.email as sender_email, s.role as sender_role, s.avatar_url as sender_avatar,
      r.name as receiver_name, r.email as receiver_email, r.role as receiver_role, r.avatar_url as receiver_avatar,
      COALESCE(sp.job_title, '') as sender_job_title, COALESCE(sp.company, '') as sender_company,
      COALESCE(rp.job_title, '') as receiver_job_title, COALESCE(rp.company, '') as receiver_company
    FROM connections c
    JOIN users s ON c.sender_id = s.id
    JOIN users r ON c.receiver_id = r.id
    LEFT JOIN alumni_profiles sp ON s.id = sp.user_id
    LEFT JOIN alumni_profiles rp ON r.id = rp.user_id
    WHERE (c.sender_id = ? OR c.receiver_id = ?)
  `;
  const params = [userId, userId];

  if (filterStatus) {
    query += ' AND c.status = ?';
    params.push(filterStatus);
  }

  query += ' ORDER BY c.updated_at DESC';

  const [connections] = await pool.query(query, params);
  res.json({ success: true, data: connections });
});

/**
 * Get connection status with a specific user
 * GET /api/connections/status/:userId
 */
exports.getConnectionStatus = asyncHandler(async (req, res) => {
  const myId = req.user.id;
  const otherId = parseInt(req.params.userId);

  if (myId === otherId) {
    return res.json({ success: true, status: 'self', connection: null });
  }

  const [existing] = await pool.query(
    `SELECT id, sender_id, receiver_id, status FROM connections 
     WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`,
    [myId, otherId, otherId, myId]
  );

  if (existing.length === 0) {
    return res.json({ success: true, status: 'none', connection: null });
  }

  const conn = existing[0];
  let displayStatus = conn.status;
  
  // If pending and I'm the sender, show "pending_sent"
  // If pending and I'm the receiver, show "pending_received"
  if (conn.status === 'pending') {
    displayStatus = conn.sender_id === myId ? 'pending_sent' : 'pending_received';
  }

  res.json({ success: true, status: displayStatus, connection: conn });
});

/**
 * Remove a connection
 * DELETE /api/connections/:id
 */
exports.removeConnection = asyncHandler(async (req, res) => {
  const connectionId = req.params.id;
  const userId = req.user.id;

  const [conn] = await pool.query('SELECT * FROM connections WHERE id = ?', [connectionId]);
  if (conn.length === 0) throw new ApiError(404, 'Connection not found');

  if (conn[0].sender_id !== userId && conn[0].receiver_id !== userId) {
    throw new ApiError(403, 'Not authorized to remove this connection');
  }

  await pool.query('DELETE FROM connections WHERE id = ?', [connectionId]);
  res.json({ success: true, message: 'Connection removed' });
});

/**
 * Get all incoming pending connection requests
 * GET /api/connections/requests
 */
exports.getIncomingRequests = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [requests] = await pool.query(`
    SELECT c.id as connection_id, c.created_at,
           u.id as user_id, u.name, u.role, u.avatar_url,
           ap.company, ap.job_title, ap.location
    FROM connections c
    JOIN users u ON c.sender_id = u.id
    LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
    WHERE c.receiver_id = ? AND c.status = 'pending'
    ORDER BY c.created_at DESC
  `, [userId]);

  res.json({ success: true, data: requests });
});

/**
 * Get count of pending incoming requests for badge
 * GET /api/connections/count/pending
 */
exports.getPendingCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const [result] = await pool.query(
    'SELECT COUNT(*) as count FROM connections WHERE receiver_id = ? AND status = "pending"',
    [userId]
  );
  res.json({ success: true, count: result[0].count });
});
