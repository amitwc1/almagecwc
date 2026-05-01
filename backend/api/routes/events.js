const express = require('express');
const router = express.Router();
const { getAllEvents, createEvent, deleteEvent, registerForEvent, unregisterFromEvent, getAttendees } = require('../controllers/eventController');
const { auth, role } = require('../middleware/auth');

router.get('/', getAllEvents);
router.post('/', auth, role('alumni', 'admin'), createEvent);
router.post('/:id/register', auth, registerForEvent);
router.delete('/:id/register', auth, unregisterFromEvent);
router.get('/:id/attendees', auth, getAttendees);
router.delete('/:id', auth, deleteEvent);

module.exports = router;
