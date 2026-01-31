const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { verifyToken, authorize } = require('../middleware/auth');

router.get('/', tournamentController.getTournaments);
router.post('/create', verifyToken, authorize('admin'), tournamentController.createTournament);
router.put('/:id', verifyToken, authorize('admin'), tournamentController.updateTournament);
router.post('/register', verifyToken, tournamentController.registerTeam);

// Match Routes
router.get('/matches/all', verifyToken, authorize('admin'), tournamentController.getAllMatches);

router.post('/:id/matches', verifyToken, authorize('admin'), tournamentController.createMatch);

router.put('/matches/:id/status', verifyToken, authorize('admin'), tournamentController.updateMatchStatus);

// Publicly accessible but filters sensitive data inside controller based on user
// We need auth middleware to identify the user (req.user), but it should be optional? 
// Actually 'auth' usually blocks requests without token. 
// If the goal is "Only enlisted players see it", then they MUST be logged in. 
// So let's require auth.
router.get('/:id/matches', verifyToken, tournamentController.getTournamentMatches);

// Registration Management (Admin)
router.get('/registrations/pending', verifyToken, authorize('admin'), tournamentController.getPendingRegistrations);

router.post('/registrations/:id/verify', verifyToken, authorize('admin'), tournamentController.verifyRegistration);

// Delete Tournament (Admin)
router.delete('/:id', verifyToken, authorize('admin'), tournamentController.deleteTournament);

router.get('/:id/registrations', verifyToken, tournamentController.getTournamentRegistrations);
router.get('/:id/registrations/count', tournamentController.getRegistrationCount);

module.exports = router;
