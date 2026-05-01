const express = require('express');
const router = express.Router();
const { getStats, getAllUsers, deleteUser, updateUserStatus, updateUserRole } = require('../controllers/adminController');
const { auth, role } = require('../middleware/auth');

router.get('/stats', auth, role('admin'), getStats);
router.get('/users', auth, role('admin'), getAllUsers);
router.put('/users/:id/status', auth, role('admin'), updateUserStatus);
router.put('/users/:id/role', auth, role('admin'), updateUserRole);
router.delete('/users/:id', auth, role('admin'), deleteUser);

module.exports = router;
