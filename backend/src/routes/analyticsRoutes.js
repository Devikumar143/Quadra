const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, authorize } = require('../middleware/auth');

router.get('/global', verifyToken, authorize('admin'), analyticsController.getGlobalStats);
router.get('/tournaments', verifyToken, authorize('admin'), analyticsController.getTournamentPerformance);

module.exports = router;
