const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { verifyToken, authorize } = require('../middleware/auth');

router.get('/me', verifyToken, achievementController.getUserAchievements);
router.get('/all', verifyToken, achievementController.getAllAchievements);

module.exports = router;
