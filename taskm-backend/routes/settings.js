const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/profile', authenticateToken, settingsController.getProfile);
router.put('/profile', authenticateToken, settingsController.updateProfile);

module.exports = router;


