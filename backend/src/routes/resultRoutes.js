const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { verifyToken, authorize } = require('../middleware/auth');

router.post('/submit', verifyToken, resultController.submitResult);
router.get('/pending', verifyToken, resultController.getPendingResults);
router.patch('/verify/:result_id', verifyToken, resultController.verifyResult);
router.post('/bulk', verifyToken, authorize('admin'), resultController.bulkSubmit);

router.get('/tournament/:tournamentId/standings', verifyToken, resultController.getTournamentStandings);
router.get('/match/:matchId', verifyToken, resultController.getMatchResults);

module.exports = router;

module.exports = router;
