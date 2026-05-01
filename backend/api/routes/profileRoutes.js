const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const {
  getMe,
  getPublicProfile,
  updateProfile,
  addEducation,
  updateEducation,
  deleteEducation,
  addExperience,
  updateExperience,
  deleteExperience,
  addSkill,
  deleteSkill
} = require('../controllers/profileController');

// ─── Multer Setup ───────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/profiles';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// ─── Routes ─────────────────────────────────────────────────────────

// Basic Info
router.get('/me', auth, getMe);
router.get('/:userId', auth, getPublicProfile);
router.put('/update', auth, upload.single('profile_image'), updateProfile);

// Education
router.post('/education', auth, addEducation);
router.put('/education/:id', auth, updateEducation);
router.delete('/education/:id', auth, deleteEducation);

// Experience
router.post('/experience', auth, addExperience);
router.put('/experience/:id', auth, updateExperience);
router.delete('/experience/:id', auth, deleteExperience);

// Skills
router.post('/skills', auth, addSkill);
router.delete('/skills/:id', auth, deleteSkill);

module.exports = router;
