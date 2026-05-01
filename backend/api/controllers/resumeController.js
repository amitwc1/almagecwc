const { pool } = require('../services_config/db');

const { asyncHandler } = require('../middleware/errorHandler');
const multer = require('multer');
const { resumeStorage } = require('../services_config/cloudinary');

exports.upload = multer({ 
  storage: resumeStorage, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  }, 
  limits: { fileSize: 5 * 1024 * 1024 } 
});

exports.uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
  const fileUrl = req.file.path;
  await pool.query(
    'INSERT INTO resumes (user_id, file_url, file_name, file_size) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE file_url = VALUES(file_url), file_name = VALUES(file_name), file_size = VALUES(file_size)',
    [req.user.id, fileUrl, req.file.originalname, req.file.size]
  );
  res.json({ success: true, file_url: fileUrl, message: 'Resume uploaded' });
});

exports.saveResumeData = asyncHandler(async (req, res) => {
  const { resume_data } = req.body;
  await pool.query(
    'INSERT INTO resumes (user_id, resume_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE resume_data = VALUES(resume_data)',
    [req.user.id, JSON.stringify(resume_data)]
  );
  res.json({ success: true, message: 'Resume data saved' });
});

exports.getResume = asyncHandler(async (req, res) => {
  const [resume] = await pool.query('SELECT * FROM resumes WHERE user_id = ?', [req.user.id]);
  res.json({ success: true, data: resume[0] || null });
});
