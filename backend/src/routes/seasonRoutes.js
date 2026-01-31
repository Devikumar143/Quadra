const express = require('express');
const router = express.Router();
const seasonController = require('../controllers/seasonController');
const { verifyToken, authorize } = require('../middleware/auth');

// Public or Protected? Likely protected or public just for viewing
router.get('/history', verifyToken, seasonController.getSeasons);
router.get('/:label', verifyToken, seasonController.getSeasonLegends);

// Admin Only
router.post('/archive', verifyToken, authorize('admin'), seasonController.archiveSeason);

module.exports = router;

module.exports = router;
