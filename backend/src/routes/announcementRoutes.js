const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

// GET all active announcements
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, content, priority FROM announcements WHERE is_active = TRUE ORDER BY priority DESC, created_at DESC"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new announcement (Admin only)
router.post('/', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const { content, priority } = req.body;
        const result = await db.query(
            "INSERT INTO announcements (content, priority) VALUES ($1, $2) RETURNING *",
            [content, priority || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE announcement (Admin only)
router.delete('/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM announcements WHERE id = $1", [id]);
        res.json({ message: 'Announcement deleted.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
