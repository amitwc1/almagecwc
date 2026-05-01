const { pool } = require('../services_config/db');

const { ApiError, asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with search, filter & pagination
 * @access  Public
 */
exports.getAllJobs = asyncHandler(async (req, res) => {
  const { search, company, location, job_type, page = 1, limit = 10 } = req.query;

  let whereClause = "WHERE j.status = 'active'";
  const params = [];

  if (search) {
    whereClause += ' AND (j.title LIKE ? OR j.company LIKE ? OR j.description LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (company) {
    whereClause += ' AND j.company LIKE ?';
    params.push(`%${company}%`);
  }
  if (location) {
    whereClause += ' AND j.location LIKE ?';
    params.push(`%${location}%`);
  }
  if (job_type) {
    whereClause += ' AND j.job_type = ?';
    params.push(job_type);
  }

  const [countResult] = await pool.query(
    `SELECT COUNT(*) as total FROM jobs j ${whereClause}`, params
  );
  const total = countResult[0].total;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const [jobs] = await pool.query(`
    SELECT j.*, u.name as posted_by_name,
      (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as applicant_count
    FROM jobs j
    JOIN users u ON j.posted_by = u.id
    ${whereClause}
    ORDER BY j.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, parseInt(limit), offset]);

  res.json({
    success: true,
    data: jobs,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
  });
});

/**
 * @route   POST /api/jobs
 * @desc    Create a new job posting
 * @access  Private (alumni, admin, recruiter)
 */
exports.createJob = asyncHandler(async (req, res) => {
  const { company, title, description, location, salary, job_type, skills_required } = req.body;

  const [result] = await pool.query(
    'INSERT INTO jobs (posted_by, company, title, description, location, salary, job_type, skills_required) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, company, title, description, location, salary, job_type || 'full-time', skills_required]
  );

  // Create notifications for all students
  const [students] = await pool.query("SELECT id FROM users WHERE role = 'student' AND status = 'active'");
  if (students.length > 0) {
    const notifValues = students.map(s => [s.id, 'job', `New Job: ${title}`, `${company} is hiring for ${title}`, '/jobs']);
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, link) VALUES ?',
      [notifValues]
    );
  }

  // Check "Hiring Partner" badge
  const [jobCount] = await pool.query('SELECT COUNT(*) as count FROM jobs WHERE posted_by = ?', [req.user.id]);
  if (jobCount[0].count >= 3) {
    const [badge] = await pool.query('SELECT id FROM badges WHERE name = ?', ['Hiring Partner']);
    if (badge.length > 0) {
      await pool.query('INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)', [req.user.id, badge[0].id]);
    }
  }

  res.status(201).json({ success: true, id: result.insertId, message: 'Job posted successfully' });
});

/**
 * @route   POST /api/jobs/:id/apply
 * @desc    Apply for a job
 * @access  Private
 */
exports.applyJob = asyncHandler(async (req, res) => {
  const jobId = req.params.id;
  const { cover_letter, resume_url } = req.body;

  const [job] = await pool.query('SELECT * FROM jobs WHERE id = ? AND status = "active"', [jobId]);
  if (job.length === 0) throw new ApiError(404, 'Job not found or no longer active');

  const [existing] = await pool.query(
    'SELECT id FROM job_applications WHERE job_id = ? AND user_id = ?', [jobId, req.user.id]
  );
  if (existing.length > 0) throw new ApiError(409, 'You have already applied for this job');

  await pool.query(
    'INSERT INTO job_applications (job_id, user_id, cover_letter, resume_url) VALUES (?, ?, ?, ?)',
    [jobId, req.user.id, cover_letter, resume_url]
  );

  // Notify job poster
  await pool.query(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
    [job[0].posted_by, 'job', 'New Application', `Someone applied to ${job[0].title}`, '/jobs']
  );

  res.status(201).json({ success: true, message: 'Application submitted successfully' });
});

/**
 * @route   GET /api/jobs/:id/applications
 * @desc    Get all applications for a job
 * @access  Private (job poster or admin)
 */
exports.getJobApplications = asyncHandler(async (req, res) => {
  const [job] = await pool.query('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
  if (job.length === 0) throw new ApiError(404, 'Job not found');
  if (job[0].posted_by !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to view applications');
  }

  const [applications] = await pool.query(`
    SELECT ja.*, u.name, u.email FROM job_applications ja
    JOIN users u ON ja.user_id = u.id WHERE ja.job_id = ?
    ORDER BY ja.applied_at DESC
  `, [req.params.id]);

  res.json({ success: true, data: applications });
});

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete a job posting
 * @access  Private
 */
exports.deleteJob = asyncHandler(async (req, res) => {
  const [job] = await pool.query('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
  if (job.length === 0) throw new ApiError(404, 'Job not found');

  if (job[0].posted_by !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to delete this job');
  }

  await pool.query('DELETE FROM jobs WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Job deleted successfully' });
});
