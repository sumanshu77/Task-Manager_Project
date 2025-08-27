const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

router.get('/tasks', authenticateToken, isAdmin, reportController.tasksReport);
router.get('/attendance', authenticateToken, isAdmin, reportController.attendanceReport);
router.get('/leaves', authenticateToken, isAdmin, reportController.leavesReport);
router.get('/wfh', authenticateToken, isAdmin, reportController.wfhReport);
router.get('/users', authenticateToken, isAdmin, reportController.usersReport);

module.exports = router;
