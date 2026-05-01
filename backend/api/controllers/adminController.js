const { pool } = require('../services_config/db');

const { ApiError, asyncHandler } = require('../middleware/errorHandler');

exports.getStats = asyncHandler(async (req, res) => {
  const [alumni] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "alumni"');
  const [students] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "student"');
  const [jobs] = await pool.query('SELECT COUNT(*) as count FROM jobs');
  const [events] = await pool.query('SELECT COUNT(*) as count FROM events');
  const [mentorships] = await pool.query('SELECT COUNT(*) as count FROM mentorship_requests');
  const [donations] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM donations');
  const [activeUsers] = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_online = TRUE');
  const [pendingUsers] = await pool.query("SELECT COUNT(*) as count FROM users WHERE status = 'pending'");
  const [bannedUsers] = await pool.query("SELECT COUNT(*) as count FROM users WHERE status = 'banned'");
  const [applications] = await pool.query('SELECT COUNT(*) as count FROM job_applications');

  // Monthly registration trends (last 6 months)
  const [monthlyTrends] = await pool.query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
    FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY month ORDER BY month ASC
  `);

  // Role distribution
  const [roleDistribution] = await pool.query(`
    SELECT role, COUNT(*) as count FROM users GROUP BY role
  `);

  res.json({
    success: true,
    totalAlumni: alumni[0].count, totalStudents: students[0].count,
    totalJobs: jobs[0].count, totalEvents: events[0].count,
    totalMentorships: mentorships[0].count, totalDonations: donations[0].total,
    activeUsers: activeUsers[0].count, pendingUsers: pendingUsers[0].count,
    bannedUsers: bannedUsers[0].count, totalApplications: applications[0].count,
    monthlyTrends, roleDistribution
  });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, status, search } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (role) { where += ' AND role = ?'; params.push(role); }
  if (status) { where += ' AND status = ?'; params.push(status); }
  if (search) { where += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM users ${where}`, params);
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const [users] = await pool.query(
    `SELECT id, name, email, role, status, is_online, last_seen, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  res.json({
    success: true, data: users,
    pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult[0].total, totalPages: Math.ceil(countResult[0].total / parseInt(limit)) }
  });
});

exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'pending', 'banned'].includes(status)) throw new ApiError(400, 'Invalid status');
  const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (user.length === 0) throw new ApiError(404, 'User not found');
  if (user[0].role === 'admin') throw new ApiError(403, 'Cannot modify admin users');
  await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
  // Notify user
  await pool.query('INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
    [req.params.id, 'system', `Account ${status}`, `Your account has been ${status === 'banned' ? 'suspended' : status === 'active' ? 'activated' : 'set to pending'}.`]);
  res.json({ success: true, message: `User status updated to ${status}` });
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['student', 'alumni', 'recruiter'].includes(role)) throw new ApiError(400, 'Invalid role');
  await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  res.json({ success: true, message: 'User role updated' });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const [user] = await pool.query('SELECT role FROM users WHERE id = ?', [req.params.id]);
  if (user.length === 0) throw new ApiError(404, 'User not found');
  if (user[0].role === 'admin') throw new ApiError(403, 'Cannot delete admin users');
  await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'User deleted' });
});
