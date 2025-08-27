const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', authenticateToken, taskController.getTasks);
router.post('/', authenticateToken, taskController.createTask);
router.put('/:id', authenticateToken, taskController.updateTask);
router.delete('/:id', authenticateToken, taskController.deleteTask);

module.exports = router;
