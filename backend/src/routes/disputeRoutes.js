const express = require('express');
const router = express.Router();
const disputeController = require('../controllers/disputeController');
const { verifyToken, authorize } = require('../middleware/auth');

router.post('/create', verifyToken, disputeController.createDispute);
router.get('/all', verifyToken, authorize('admin', 'moderator'), disputeController.getDisputes);
router.patch('/:dispute_id/resolve', verifyToken, authorize('admin', 'moderator'), disputeController.resolveDispute);

module.exports = router;

module.exports = router;
