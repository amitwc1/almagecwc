const express = require('express');
const router = express.Router();
const { requestMentorship, getMentorships, updateMentorshipStatus } = require('../controllers/mentorshipController');
const { auth } = require('../middleware/auth');

router.post('/request', auth, requestMentorship);
router.get('/my-requests', auth, getMentorships);
router.put('/respond', auth, updateMentorshipStatus);
// Keep legacy route for backward compatibility
router.get('/', auth, getMentorships);

module.exports = router;
