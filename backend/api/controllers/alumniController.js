const { pool } = require('../services_config/db');

const { ApiError, asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/alumni
 * @desc    Get all alumni with dynamic filtering and pagination
 * @access  Public
 */
exports.getAllAlumni = asyncHandler(async (req, res) => {
  const { 
    name, 
    company, 
    location, 
    skills, 
    department, 
    graduationYear, 
    rollNumber,
    page = 1, 
    limit = 10 
  } = req.query;

  // Initial query state
  let whereClause = "WHERE u.role = 'alumni' AND u.status = 'active'";
  const params = [];

  // 1. NAME Filter
  if (name) {
    whereClause += " AND LOWER(u.name) LIKE ?";
    params.push(`%${name.toLowerCase()}%`);
  }

  // 2. COMPANY Filter
  if (company) {
    whereClause += " AND LOWER(ap.company) LIKE ?";
    params.push(`%${company.toLowerCase()}%`);
  }

  // 3. LOCATION Filter
  if (location) {
    whereClause += " AND LOWER(ap.location) LIKE ?";
    params.push(`%${location.toLowerCase()}%`);
  }

  // 4. SKILLS Filter
  if (skills) {
    whereClause += " AND LOWER(ap.skills) LIKE ?";
    params.push(`%${skills.toLowerCase()}%`);
  }

  // 5. DEPARTMENT Filter
  if (department) {
    whereClause += " AND LOWER(ap.department) LIKE ?";
    params.push(`%${department.toLowerCase()}%`);
  }

  // 6. GRADUATION YEAR Filter
  if (graduationYear) {
    whereClause += " AND ap.graduation_year = ?";
    params.push(Number(graduationYear));
  }

  // 7. ROLL NUMBER Filter (Exact Match)
  if (rollNumber) {
    whereClause += " AND p.roll_number = ?";
    params.push(rollNumber.trim().toUpperCase());
  }

  // Pagination calculation
  const pPage = Number(page);
  const pLimit = Number(limit);
  const offset = (pPage - 1) * pLimit;

  // Execute Count Query for Pagination
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM users u 
    JOIN alumni_profiles ap ON u.id = ap.user_id 
    LEFT JOIN profiles p ON u.id = p.user_id
    ${whereClause}
  `;
  const [countResult] = await pool.query(countQuery, params);
  const total = countResult[0].total;

  // Main Data Query
  const dataQuery = `
    SELECT u.id, u.name, u.email, u.is_online, u.avatar_url,
           ap.*, p.roll_number,
           COALESCE(u.avatar_url, p.profile_image) as fallback_image
    FROM users u
    JOIN alumni_profiles ap ON u.id = ap.user_id
    LEFT JOIN profiles p ON u.id = p.user_id
    ${whereClause}
    ORDER BY ap.graduation_year DESC, u.name ASC
    LIMIT ? OFFSET ?
  `;
  
  const [alumni] = await pool.query(dataQuery, [...params, pLimit, offset]);

  res.json({
    success: true,
    data: alumni.map(a => ({
      ...a,
      profile_image: a.profile_image || a.fallback_image || a.avatar_url
    })),
    pagination: {
      total,
      page: pPage,
      limit: pLimit,
      totalPages: Math.ceil(total / pLimit)
    }
  });
});

/**
 * @route   GET /api/alumni/:id
 * @desc    Get single alumni profile
 * @access  Public
 */
exports.getAlumniById = asyncHandler(async (req, res) => {
  const [alumni] = await pool.query(`
    SELECT u.id, u.name, u.email, u.created_at, u.is_online, u.last_seen, u.avatar_url,
           ap.*, p.roll_number
    FROM users u
    JOIN alumni_profiles ap ON u.id = ap.user_id
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE u.id = ? AND u.role = 'alumni'
  `, [req.params.id]);

  if (alumni.length === 0) {
    throw new ApiError(404, 'Alumni profile not found');
  }

  const profile = alumni[0];
  const profile_image = profile.profile_image || profile.avatar_url;

  // Get badges
  const [badges] = await pool.query(`
    SELECT b.name, b.icon, b.points FROM user_badges ub
    JOIN badges b ON ub.badge_id = b.id WHERE ub.user_id = ?
  `, [req.params.id]);

  res.json({ success: true, ...profile, profile_image, badges });
});

/**
 * @route   PUT /api/alumni/update
 * @desc    Update alumni profile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { graduation_year, department, company, job_title, location, skills, bio, linkedin, profile_image } = req.body;

  await pool.query(`
    UPDATE alumni_profiles SET graduation_year = ?, department = ?, company = ?, job_title = ?,
      location = ?, skills = ?, bio = ?, linkedin = ?, profile_image = ?
    WHERE user_id = ?
  `, [graduation_year, department, company, job_title, location, skills, bio, linkedin, profile_image, req.user.id]);

  if (req.body.name) {
    await pool.query('UPDATE users SET name = ? WHERE id = ?', [req.body.name, req.user.id]);
  }

  // Check for "First Steps" badge (profile completed)
  if (company && job_title && graduation_year && department) {
    const [badge] = await pool.query('SELECT id FROM badges WHERE name = ?', ['First Steps']);
    if (badge.length > 0) {
      await pool.query('INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)', [req.user.id, badge[0].id]);
    }
  }

  res.json({ success: true, message: 'Profile updated successfully' });
});
