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

const { profileStorage } = require('../services_config/cloudinary');

// ─── Multer Setup (Cloudinary) ──────────────────────────────────────
const upload = multer({
  storage: profileStorage,
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
