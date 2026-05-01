const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage, markAsRead, getContacts, upload } = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

router.get('/conversations', auth, getConversations);
router.get('/contacts', auth, getContacts);
router.post('/send', auth, upload.single('file'), sendMessage);

router.put('/read', auth, markAsRead);
router.get('/:userId', auth, getMessages);

module.exports = router;
