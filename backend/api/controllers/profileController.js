const { pool } = require('../services_config/db');

const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const Joi = require('joi');

/**
 * @desc    Get current user profile
 * @route   GET /api/profile/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get basic info and profile
  const [profileData] = await pool.query(`
    SELECT u.name, u.email, u.role, p.*
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    WHERE u.id = ?
  `, [userId]);

  if (profileData.length === 0) {
    throw new ApiError(404, 'Profile not found');
  }

  // Get education
  const [education] = await pool.query('SELECT * FROM education WHERE user_id = ? ORDER BY end_year DESC', [userId]);

  // Get experience
  const [experience] = await pool.query('SELECT * FROM experience WHERE user_id = ? ORDER BY start_date DESC', [userId]);

  // Get skills
  const [skills] = await pool.query('SELECT * FROM skills WHERE user_id = ?', [userId]);

  res.json({
    success: true,
    data: {
      ...profileData[0],
      education,
      experience,
      skills
    }
  });
});

/**
 * @desc    Get public profile by userId
 * @route   GET /api/profile/:userId
 * @access  Private
 */
exports.getPublicProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  // Get basic info and profile
  const [profileData] = await pool.query(`
    SELECT u.id as user_id, u.name, u.email, u.role, u.avatar_url, p.bio, p.phone, p.location, p.profile_image, p.linkedin, p.github, p.portfolio
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    WHERE u.id = ?
  `, [userId]);

  if (profileData.length === 0) {
    throw new ApiError(404, 'Profile not found');
  }

  const profile = profileData[0];

  // PRIVACY LOGIC: Only show phone number to connections, self, or admin
  let isConnected = false;
  if (currentUserId === parseInt(userId) || req.user.role === 'admin') {
    isConnected = true;
  } else {
    const [connection] = await pool.query(`
      SELECT id FROM connections 
      WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) 
      AND status = 'accepted'
    `, [currentUserId, userId, userId, currentUserId]);
    
    if (connection.length > 0) {
      isConnected = true;
    }
  }

  // Security: Remove phone if not connected
  if (!isConnected) {
    delete profile.phone;
  }

  // Get education, experience, skills
  const [education] = await pool.query('SELECT * FROM education WHERE user_id = ? ORDER BY end_year DESC', [userId]);
  const [experience] = await pool.query('SELECT * FROM experience WHERE user_id = ? ORDER BY start_date DESC', [userId]);
  const [skills] = await pool.query('SELECT * FROM skills WHERE user_id = ?', [userId]);

  res.json({
    success: true,
    data: {
      ...profile,
      education,
      experience,
      skills,
      isConnected // Frontend can use this to show the "Connect to view" message
    }
  });
});


/**
 * @desc    Update basic profile info
 * @route   PUT /api/profile/update
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { 
    name, 
    phone, 
    bio, 
    location, 
    department, 
    graduation_year, 
    roll_number,
    linkedin, 
    github, 
    portfolio 
  } = req.body;

  const schema = Joi.object({
    name: Joi.string().min(2).max(100),
    phone: Joi.string().allow('', null).max(20),
    bio: Joi.string().allow('', null).max(1000),
    location: Joi.string().allow('', null).max(255),
    department: Joi.string().allow('', null).max(255),
    graduation_year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 10).allow('', null),
    roll_number: Joi.string().allow('', null).max(50),
    linkedin: Joi.string().allow('', null).max(255),
    github: Joi.string().allow('', null).max(255),
    portfolio: Joi.string().allow('', null).max(255)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    console.error('[ProfileUpdate] Validation Error:', error.details[0].message);
    throw new ApiError(400, error.details[0].message);
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Process roll number
    let finalRollNumber = null;
    if (roll_number) {
      finalRollNumber = roll_number.trim().toUpperCase();
      // Check for uniqueness
      const [existing] = await connection.query(
        'SELECT user_id FROM profiles WHERE roll_number = ? AND user_id != ?',
        [finalRollNumber, userId]
      );
      if (existing.length > 0) {
        throw new ApiError(400, 'Roll number already exists');
      }
    }

    // 2. Update name in users table
    if (name) {
      await connection.query('UPDATE users SET name = ? WHERE id = ?', [name, userId]);
    }

    // 3. Update profiles table
    await connection.query(`
      UPDATE profiles 
      SET phone = ?, bio = ?, location = ?, department = ?, graduation_year = ?, roll_number = ?, linkedin = ?, github = ?, portfolio = ?
      WHERE user_id = ?
    `, [phone, bio, location, department, graduation_year || null, finalRollNumber, linkedin, github, portfolio, userId]);

    // 3. Sync with alumni_profiles if user is alumni
    if (req.user.role === 'alumni') {
      try {
        await connection.query(`
          UPDATE alumni_profiles 
          SET department = ?, graduation_year = ?, location = ?, bio = ?, linkedin = ?
          WHERE user_id = ?
        `, [department, graduation_year || null, location, bio, linkedin, userId]);
      } catch (alumniErr) {
        console.warn('[ProfileUpdate] Alumni sync failed (likely missing columns):', alumniErr.message);
        // We don't throw here so the main profile save still works
      }
    }

    // 4. Update profile image if uploaded (Cloudinary)
    if (req.file) {
      const imageUrl = req.file.path;
      await connection.query('UPDATE profiles SET profile_image = ? WHERE user_id = ?', [imageUrl, userId]);
      await connection.query('UPDATE users SET avatar_url = ? WHERE id = ?', [imageUrl, userId]);
      
      if (req.user.role === 'alumni') {
        await connection.query('UPDATE alumni_profiles SET profile_image = ? WHERE user_id = ?', [imageUrl, userId]);
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('[ProfileUpdate] Database Error:', err.message);
    console.error('[ProfileUpdate] Full Error:', err);
    throw err;
  } finally {
    connection.release();
  }
});

// 🎓 EDUCATION
exports.addEducation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { college, degree, branch, start_year, end_year } = req.body;

  const [result] = await pool.query(
    'INSERT INTO education (user_id, college, degree, branch, start_year, end_year) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, college, degree, branch, start_year, end_year]
  );

  res.status(201).json({ success: true, id: result.insertId, message: 'Education added' });
});

exports.updateEducation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { college, degree, branch, start_year, end_year } = req.body;

  const [result] = await pool.query(
    'UPDATE education SET college = ?, degree = ?, branch = ?, start_year = ?, end_year = ? WHERE id = ? AND user_id = ?',
    [college, degree, branch, start_year, end_year, id, userId]
  );

  if (result.affectedRows === 0) throw new ApiError(404, 'Education entry not found');
  res.json({ success: true, message: 'Education updated' });
});

exports.deleteEducation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const [result] = await pool.query('DELETE FROM education WHERE id = ? AND user_id = ?', [id, userId]);
  if (result.affectedRows === 0) throw new ApiError(404, 'Education entry not found');
  res.json({ success: true, message: 'Education deleted' });
});

// 💼 EXPERIENCE
exports.addExperience = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { company, role, location, start_date, end_date, currently_working, description } = req.body;

  const [result] = await pool.query(
    'INSERT INTO experience (user_id, company, role, location, start_date, end_date, currently_working, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, company, role, location, start_date, end_date || null, currently_working, description]
  );

  res.status(201).json({ success: true, id: result.insertId, message: 'Experience added' });
});

exports.updateExperience = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { company, role, location, start_date, end_date, currently_working, description } = req.body;

  const [result] = await pool.query(
    'UPDATE experience SET company = ?, role = ?, location = ?, start_date = ?, end_date = ?, currently_working = ?, description = ? WHERE id = ? AND user_id = ?',
    [company, role, location, start_date, end_date || null, currently_working, description, id, userId]
  );

  if (result.affectedRows === 0) throw new ApiError(404, 'Experience entry not found');
  res.json({ success: true, message: 'Experience updated' });
});

exports.deleteExperience = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const [result] = await pool.query('DELETE FROM experience WHERE id = ? AND user_id = ?', [id, userId]);
  if (result.affectedRows === 0) throw new ApiError(404, 'Experience entry not found');
  res.json({ success: true, message: 'Experience deleted' });
});

// 🛠️ SKILLS
exports.addSkill = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { skill_name } = req.body;

  // Prevent duplicates
  const [existing] = await pool.query('SELECT id FROM skills WHERE user_id = ? AND skill_name = ?', [userId, skill_name]);
  if (existing.length > 0) throw new ApiError(400, 'Skill already exists');

  const [result] = await pool.query('INSERT INTO skills (user_id, skill_name) VALUES (?, ?)', [userId, skill_name]);
  res.status(201).json({ success: true, id: result.insertId, skill_name });
});

exports.deleteSkill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const [result] = await pool.query('DELETE FROM skills WHERE id = ? AND user_id = ?', [id, userId]);
  if (result.affectedRows === 0) throw new ApiError(404, 'Skill not found');
  res.json({ success: true, message: 'Skill deleted' });
});
