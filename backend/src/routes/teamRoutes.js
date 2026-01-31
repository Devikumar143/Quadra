const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { verifyToken, authorize } = require('../middleware/auth');

router.post('/create', verifyToken, teamController.createTeam);
router.post('/join', verifyToken, teamController.joinTeam);
router.get('/my-team', verifyToken, teamController.getMyTeam);
router.post('/leave', verifyToken, teamController.leaveTeam);
router.delete('/delete', verifyToken, teamController.deleteTeam);

// Admin Only
router.get('/all', verifyToken, authorize('admin'), teamController.getAllTeams);

router.put('/:id', verifyToken, teamController.updateTeam);

router.get('/:id', verifyToken, teamController.getTeamDetails);
router.get('/:id/performance', verifyToken, teamController.getTeamPerformance);
router.get('/:id/messages', verifyToken, teamController.getMessages);
router.post('/:id/messages', verifyToken, teamController.sendMessage);

module.exports = router;

module.exports = router;
