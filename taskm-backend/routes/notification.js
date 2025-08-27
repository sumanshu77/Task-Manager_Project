const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', authenticateToken, notificationController.getUserNotifications);
router.post('/:id/read', authenticateToken, notificationController.markRead);

module.exports = router;
