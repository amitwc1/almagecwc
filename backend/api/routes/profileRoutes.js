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

// Profile update with multer error handling
router.put('/update', auth, (req, res, next) => {
  upload.single('profile_image')(req, res, (err) => {
    if (err) {
      console.error('[ProfileUpdate] Multer/Cloudinary upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'Image size must be under 2MB' });
      }
      
      // Fallback for weird error objects
      const errorMessage = err.message || (typeof err === 'string' ? err : JSON.stringify(err)) || 'Unknown upload error';
      return res.status(400).json({ success: false, error: `Upload failed: ${errorMessage}` });
    }
    next();
  });
}, updateProfile);

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
