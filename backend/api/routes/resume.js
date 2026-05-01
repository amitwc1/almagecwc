const express = require('express');
const router = express.Router();
const { uploadResume, saveResumeData, getResume, upload } = require('../controllers/resumeController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getResume);
router.post('/upload', auth, upload.single('resume'), uploadResume);
router.post('/builder', auth, saveResumeData);

module.exports = router;
