const express = require('express');
const router = express.Router();
const wfhController = require('../controllers/wfhController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// User routes
router.get('/', authenticateToken, wfhController.getUserWFH);
router.post('/', authenticateToken, wfhController.createWFH);

// Admin routes
router.get('/all', authenticateToken, isAdmin, wfhController.getAllWFH);
router.patch('/:id/status', authenticateToken, isAdmin, wfhController.updateStatus);

module.exports = router;
