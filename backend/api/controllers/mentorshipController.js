const { pool } = require('../services_config/db');

const { ApiError, asyncHandler } = require('../middleware/errorHandler');

/**
 * Request mentorship — students only
 * POST /api/mentorship/request
 */
exports.requestMentorship = asyncHandler(async (req, res) => {
  const { mentor_id, message } = req.body;
  const studentId = req.user.id;

  if (!mentor_id) throw new ApiError(400, 'Mentor ID is required');
  if (req.user.role !== 'student') throw new ApiError(403, 'Only students can request mentorship');
  if (parseInt(mentor_id) === studentId) throw new ApiError(400, 'Cannot request mentorship from yourself');

  // Verify the mentor is an alumni
  const [mentor] = await pool.query('SELECT id, name, role FROM users WHERE id = ?', [mentor_id]);
  if (mentor.length === 0) throw new ApiError(404, 'Mentor not found');
  if (mentor[0].role !== 'alumni') throw new ApiError(400, 'Mentorship can only be requested from alumni');

  // Check for existing active request
  const [existing] = await pool.query(
    'SELECT id, status FROM mentorship_requests WHERE student_id = ? AND mentor_id = ? AND status = "pending"',
    [studentId, mentor_id]
  );
  if (existing.length > 0) throw new ApiError(400, 'You already have a pending mentorship request with this alumni');

  // Check for already accepted mentorship
  const [accepted] = await pool.query(
    'SELECT id FROM mentorship_requests WHERE student_id = ? AND mentor_id = ? AND status = "accepted"',
    [studentId, mentor_id]
  );
  if (accepted.length > 0) throw new ApiError(400, 'You already have an active mentorship with this alumni');

  const trimmedMessage = (message || 'I would love to connect for mentorship.').trim();
  if (trimmedMessage.length > 1000) throw new ApiError(400, 'Message must be under 1000 characters');

  const [result] = await pool.query(
    'INSERT INTO mentorship_requests (student_id, mentor_id, message) VALUES (?, ?, ?)',
    [studentId, mentor_id, trimmedMessage]
  );

  // Notify mentor
  const [student] = await pool.query('SELECT name FROM users WHERE id = ?', [studentId]);
  await pool.query(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
    [mentor_id, 'mentorship', 'Mentorship Request', `${student[0].name} wants to connect for mentorship`, '/mentorship']
  );

  // Real-time notification
  const io = req.app.get('io');
  const onlineUsers = req.app.get('onlineUsers');
  const mentorSocket = onlineUsers.get(parseInt(mentor_id));
  if (mentorSocket) {
    io.to(mentorSocket).emit('new_notification', {
      type: 'mentorship',
      title: 'Mentorship Request',
      message: `${student[0].name} wants to connect for mentorship`,
      userId: mentor_id
    });
  }

  res.status(201).json({ success: true, id: result.insertId, message: 'Mentorship request sent' });
});

/**
 * Get all mentorship requests for current user
 * GET /api/mentorship/my-requests
 */
exports.getMentorships = asyncHandler(async (req, res) => {
  const [requests] = await pool.query(`
    SELECT mr.*, 
      s.name as student_name, s.email as student_email, s.avatar_url as student_avatar,
      m.name as mentor_name, m.email as mentor_email, m.avatar_url as mentor_avatar,
      COALESCE(mp.job_title, '') as mentor_job_title, COALESCE(mp.company, '') as mentor_company,
      COALESCE(mp.skills, '') as mentor_skills
    FROM mentorship_requests mr
    JOIN users s ON mr.student_id = s.id 
    JOIN users m ON mr.mentor_id = m.id
    LEFT JOIN alumni_profiles mp ON m.id = mp.user_id
    WHERE mr.student_id = ? OR mr.mentor_id = ? 
    ORDER BY mr.created_at DESC
  `, [req.user.id, req.user.id]);
  res.json({ success: true, data: requests });
});

/**
 * Respond to mentorship request — alumni only
 * PUT /api/mentorship/respond
 */
exports.updateMentorshipStatus = asyncHandler(async (req, res) => {
  const { request_id, status } = req.body;

  if (!request_id) throw new ApiError(400, 'Request ID is required');
  if (!['accepted', 'rejected'].includes(status)) throw new ApiError(400, 'Status must be "accepted" or "rejected"');

  const [request] = await pool.query('SELECT * FROM mentorship_requests WHERE id = ?', [request_id]);
  if (request.length === 0) throw new ApiError(404, 'Request not found');
  if (request[0].mentor_id !== req.user.id) throw new ApiError(403, 'Only the mentor can respond to this request');
  if (request[0].status !== 'pending') throw new ApiError(400, `Request already ${request[0].status}`);

  await pool.query('UPDATE mentorship_requests SET status = ? WHERE id = ?', [status, request_id]);

  // Notify student
  const [mentorUser] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
  await pool.query(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
    [request[0].student_id, 'mentorship', `Mentorship ${status}`, `${mentorUser[0].name} ${status} your mentorship request`, '/mentorship']
  );

  // Real-time notification
  const io = req.app.get('io');
  const onlineUsers = req.app.get('onlineUsers');
  const studentSocket = onlineUsers.get(request[0].student_id);
  if (studentSocket) {
    io.to(studentSocket).emit('new_notification', {
      type: 'mentorship',
      title: `Mentorship ${status}`,
      message: `${mentorUser[0].name} ${status} your mentorship request`,
      userId: request[0].student_id
    });
  }

  // Check Top Mentor badge
  if (status === 'accepted') {
    const [count] = await pool.query(
      "SELECT COUNT(*) as c FROM mentorship_requests WHERE mentor_id = ? AND status = 'accepted'",
      [req.user.id]
    );
    if (count[0].c >= 5) {
      const [badge] = await pool.query('SELECT id FROM badges WHERE name = ?', ['Top Mentor']);
      if (badge.length > 0) {
        await pool.query('INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)', [req.user.id, badge[0].id]);
      }
    }
  }

  res.json({ success: true, message: `Mentorship request ${status}` });
});
