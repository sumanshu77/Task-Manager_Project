const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

router.get('/', authenticateToken, attendanceController.getAttendance);
router.post('/check-in', authenticateToken, attendanceController.checkIn);
router.post('/check-out', authenticateToken, attendanceController.checkOut);
router.post('/break', authenticateToken, attendanceController.break);

// Leave requests
router.get('/leaves', authenticateToken, attendanceController.getLeaves);
router.post('/leaves', authenticateToken, attendanceController.createLeave);

// Admin leave management
router.get('/leaves/all', authenticateToken, isAdmin, attendanceController.getAllLeaves);
router.patch('/leaves/:id/status', authenticateToken, isAdmin, attendanceController.updateLeaveStatus);

// Holidays
router.get('/holidays', attendanceController.getHolidays);
router.post('/holidays', authenticateToken, attendanceController.createHoliday);

module.exports = router;
