const express = require('express');
const router = express.Router();
const {
  sendConnectionRequest,
  respondToConnection,
  getConnections,
  getIncomingRequests,
  getPendingCount,
  getConnectionStatus,
  removeConnection
} = require('../controllers/connectionController');
const { auth } = require('../middleware/auth');

router.post('/send', auth, sendConnectionRequest);
router.put('/respond', auth, respondToConnection);
router.get('/list', auth, getConnections);
router.get('/requests', auth, getIncomingRequests);
router.get('/count/pending', auth, getPendingCount);
router.get('/status/:userId', auth, getConnectionStatus);
router.delete('/:id', auth, removeConnection);

module.exports = router;
