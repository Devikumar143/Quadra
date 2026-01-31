const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');
const { verifyToken } = require('../middleware/auth');

router.post('/posts', verifyToken, recruitmentController.createPost);
router.get('/posts', verifyToken, recruitmentController.getPosts);
router.patch('/posts/:id/close', verifyToken, recruitmentController.closePost);

module.exports = router;
