const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

router.post('/', authenticateToken, isAdmin, projectController.createProject);
router.get('/', authenticateToken, isAdmin, projectController.getAllProjects);
router.get('/me', authenticateToken, projectController.getUserProjects);
router.post('/invite', authenticateToken, isAdmin, projectController.inviteMember);
router.post('/invites/:id/accept', authenticateToken, projectController.acceptInvite);
router.get('/invites', authenticateToken, projectController.getInvitations);
router.get('/:id', authenticateToken, projectController.getProject);
router.put('/:id', authenticateToken, isAdmin, projectController.updateProject);
router.delete('/:id', authenticateToken, isAdmin, projectController.deleteProject);
router.delete('/:id/members/:userId', authenticateToken, isAdmin, projectController.removeMember);
router.put('/:id/members/:userId/role', authenticateToken, isAdmin, projectController.changeMemberRole);
router.post('/:id/members', authenticateToken, isAdmin, projectController.addMember);

module.exports = router;


