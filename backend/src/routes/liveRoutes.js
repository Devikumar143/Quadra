const express = require('express');
const router = express.Router();
const liveMatchController = require('../controllers/liveMatchController');
const { verifyToken, authorize } = require('../middleware/auth');

// Admin only route to push updates
router.post('/:matchId/update', verifyToken, authorize('admin'), liveMatchController.updateLiveMatch);

// Must come BEFORE /:matchId routes to avoid "active" being treated as a matchId
router.get('/active', verifyToken, liveMatchController.getAllLiveMatches);
router.get('/:matchId/state', verifyToken, liveMatchController.getLiveMatchState);

module.exports = router;

module.exports = router;
