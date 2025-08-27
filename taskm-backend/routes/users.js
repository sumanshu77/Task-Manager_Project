const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

router.get('/', authenticateToken, isAdmin, userController.listUsers);
router.post('/', authenticateToken, isAdmin, userController.createUser);
router.delete('/:id', authenticateToken, isAdmin, userController.deleteUser);
router.put('/:id/role', authenticateToken, isAdmin, userController.changeUserRole);

module.exports = router;


