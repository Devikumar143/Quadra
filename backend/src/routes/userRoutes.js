const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, authorize } = require('../middleware/auth');

// GET Global Leaderboard
router.get('/leaderboard', verifyToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                id, ff_ign, university_id,
                stats->>'kd_ratio' as kd,
                stats->>'win_rate' as win_rate,
                stats->>'total_kills' as kills,
                stats->>'total_matches' as matches,
                id = $1 as is_me
            FROM users 
            WHERE role = 'player' AND stats IS NOT NULL
            ORDER BY (stats->>'kd_ratio')::float DESC NULLS LAST
            LIMIT 50
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Leaderboard error:', err.message);
        res.status(500).json({ message: "Ranking aggregation failed." });
    }
});

// GET Notifications
router.get('/notifications', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all unverified users
router.get('/unverified', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, full_name, university_id, ff_ign, email, is_verified FROM users WHERE is_verified = false AND role != 'admin' ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all players (Admin only)
router.get('/all', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, full_name, university_id, ff_uid, ff_ign, email, is_verified, stats, role, combat_role, created_at FROM users ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get current user stats and war log
router.get('/me/stats', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get stats from user profile
        const userRes = await db.query("SELECT stats, ff_ign, bio, social_links, avatar_id, prestige_points, referral_code, combat_role FROM users WHERE id = $1", [userId]);
        const user = userRes.rows[0];
        const profileStats = user.stats || {};

        // 2. Get recent matches (joining match_results with matches and tournaments)
        const matchRes = await db.query(`
            SELECT
                mr.id as result_id,
                mr.kills,
                mr.placement,
                mr.total_points,
                mr.created_at,
                m.map_name,
                t.title as tournament_title
            FROM match_results mr
            JOIN matches m ON mr.match_id = m.id
            JOIN tournaments t ON m.tournament_id = t.id
            JOIN team_members tm ON mr.team_id = tm.team_id
            WHERE tm.user_id = $1
            ORDER BY mr.created_at DESC
            LIMIT 10
        `, [userId]);

        res.json({
            performance: {
                kd_ratio: profileStats.kd_ratio || "0.00",
                win_rate: profileStats.win_rate || "0%",
                headshot_rate: profileStats.headshot_rate || "0%",
                avg_damage: profileStats.avg_damage || "0",
                total_matches: profileStats.total_matches || "0",
                total_kills: profileStats.total_kills || "0"
            },
            profile: {
                bio: user.bio,
                social_links: user.social_links,
                avatar_id: user.avatar_id,
                prestige_points: user.prestige_points,
                referral_code: user.referral_code,
                combat_role: user.combat_role
            },
            warLog: matchRes.rows
        });
    } catch (err) {
        console.error('Stats error:', err.message);
        res.status(500).json({ message: "Failed to fetch war room data." });
    }
});

// GET Stats History for Charts
router.get('/me/stats-history', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(`
            SELECT 
                mr.kills, 
                mr.placement, 
                mr.created_at
            FROM match_results mr
            JOIN team_members tm ON mr.team_id = tm.team_id
            WHERE tm.user_id = $1
            ORDER BY mr.created_at ASC
            LIMIT 20
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch history." });
    }
});

// UPDATE Push Token
router.put('/me/push-token', verifyToken, async (req, res) => {
    try {
        const { push_token } = req.body;
        const userId = req.user.id;

        // Basic validation: ensure it looks like an Expo token
        if (push_token && !push_token.startsWith('ExponentPushToken')) {
            console.warn(`[Push] Invalid token rejected for user ${userId}: ${push_token.substring(0, 50)}...`);
            return res.status(400).json({ message: "Invalid push token format." });
        }

        await db.query(
            "UPDATE users SET push_token = $1 WHERE id = $2",
            [push_token, userId]
        );

        res.json({ message: "Push token updated." });
    } catch (err) {
        console.error('Push token update error:', err.message);
        res.status(500).json({ message: "Failed to update push token." });
    }
});

// GET Comprehensive Match History
router.get('/me/match-history', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(`
            SELECT
                mr.id as result_id,
                mr.kills,
                mr.placement,
                mr.total_points,
                mr.created_at,
                m.map_name,
                t.title as tournament_title,
                t.id as tournament_id
            FROM match_results mr
            JOIN matches m ON mr.match_id = m.id
            JOIN tournaments t ON m.tournament_id = t.id
            JOIN team_members tm ON mr.team_id = tm.team_id
            WHERE tm.user_id = $1
            ORDER BY mr.created_at DESC
            LIMIT 50
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Match history error:', err.message);
        res.status(500).json({ message: "Failed to fetch combat history." });
    }
});

// UPDATE User Profile (Gamer Passport)
router.put('/me/profile', verifyToken, async (req, res) => {
    try {
        const { full_name, ff_ign, ff_uid, bio, social_links, avatar_id, combat_role } = req.body;
        const userId = req.user.id;

        await db.query(`
            UPDATE users 
            SET full_name = COALESCE($1, full_name),
                bio = COALESCE($2, bio),
                social_links = COALESCE($3, social_links),
                avatar_id = COALESCE($4, avatar_id),
                combat_role = COALESCE($5, combat_role),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
        `, [full_name, bio, JSON.stringify(social_links), avatar_id, combat_role, userId]);

        res.json({ message: "Profile updated successfully." });
    } catch (err) {
        console.error('Profile update error:', err.message);
        res.status(500).json({ message: "Update failed." });
    }
});

// REDEEM Referral Code
router.post('/me/redeem-referral', verifyToken, async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        if (!code) {
            return res.status(400).json({ message: "Referral code is required." });
        }

        const normalizedCode = code.trim().toUpperCase();

        // 1. Get current user
        const userRes = await db.query("SELECT id, referral_code FROM users WHERE id = $1", [userId]);
        if (userRes.rowCount === 0) return res.status(404).json({ message: "User not found." });
        const user = userRes.rows[0];

        if (user.referral_code === normalizedCode) {
            return res.status(400).json({ message: "You cannot use your own referral code." });
        }

        // 2. Find referrer
        const referrerRes = await db.query("SELECT id FROM users WHERE referral_code = $1", [normalizedCode]);
        if (referrerRes.rowCount === 0) {
            return res.status(404).json({ message: "Invalid referral code. Correct format is QD-XXXXXX." });
        }
        const referrer = referrerRes.rows[0];

        // 3. Award Points (100 to referrer, 50 to referred)
        await db.query("UPDATE users SET prestige_points = prestige_points + 100 WHERE id = $1", [referrer.id]);
        await db.query("UPDATE users SET prestige_points = prestige_points + 50 WHERE id = $1", [userId]);

        res.json({ message: "Referral successful! 50 Prestige Points awarded.", points: 50 });
    } catch (err) {
        console.error('Referral error:', err.message);
        res.status(500).json({ message: "Referral processing failed." });
    }
});

// Verify a user
router.post('/verify/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("UPDATE users SET is_verified = true WHERE id = $1", [id]);
        res.json({ message: 'User verified successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update user stats (Admin only)
router.put('/:id/stats', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { stats, combat_role, role } = req.body;

        await db.query(
            "UPDATE users SET stats = COALESCE($1, stats), combat_role = COALESCE($2, combat_role), role = COALESCE($3, role) WHERE id = $4",
            [stats ? JSON.stringify(stats) : null, combat_role, role, id]
        );
        res.json({ message: 'Operative record synchronized successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark Notifications as Read
router.put('/notifications/read', verifyToken, async (req, res) => {
    try {
        await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
            [req.user.id]
        );
        res.json({ message: 'Notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Broadcast Notifications (Admin only)
router.post('/broadcast', verifyToken, authorize('admin'), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { targetType, targetId, type, message } = req.body;
        let query = "";
        let params = [];

        switch (targetType) {
            case 'global':
                query = "INSERT INTO notifications (user_id, type, message) SELECT id, $1, $2 FROM users WHERE role = 'player'";
                params = [type || 'system', message];
                break;
            case 'tournament':
                query = `
                    INSERT INTO notifications (user_id, type, message)
                    SELECT DISTINCT tm.user_id, $1, $2
                    FROM registrations r
                    JOIN team_members tm ON r.team_id = tm.team_id
                    WHERE r.tournament_id = $3
                `;
                params = [type || 'match', message, targetId];
                break;
            case 'match':
                // For match, we ping everyone in the tournament the match belongs to
                query = `
                    INSERT INTO notifications (user_id, type, message)
                    SELECT DISTINCT tm.user_id, $1, $2
                    FROM matches m
                    JOIN registrations r ON m.tournament_id = r.tournament_id
                    JOIN team_members tm ON r.team_id = tm.team_id
                    WHERE m.id = $3
                `;
                params = [type || 'match', message, targetId];
                break;
            case 'user':
                query = "INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)";
                params = [targetId, type || 'system', message];
                break;
            default:
                return res.status(400).json({ message: 'Invalid target type.' });
        }

        await db.query(query, params);

        // Real-time emission
        if (req.io) {
            switch (targetType) {
                case 'global':
                    req.io.emit('notification', { type: type || 'system', message });
                    // Send Push Notification
                    req.notificationService.broadcastNotification('SYSTEM ALERT', message);
                    break;
                case 'tournament':
                    req.io.to(`tournament_${targetId}`).emit('notification', { type: type || 'match', message });
                    // TODO: Implement scoped push notifications for tournaments
                    break;
                case 'match':
                    req.io.to(`match_${targetId}`).emit('live_update', {
                        type: 'ticker',
                        data: { text: `[STRATEGIC INTEL] ${message}` },
                        matchId: targetId,
                        timestamp: new Date().toISOString()
                    });
                    break;
                case 'user':
                    req.io.to(`user_${targetId}`).emit('notification', { type: type || 'system', message });
                    // Send Push Notification to specific user
                    req.notificationService.sendPushNotification([targetId], 'PERSONAL ALERT', message);
                    break;
            }
        }

        res.json({ message: 'Broadcast successful.' });
    } catch (err) {
        console.error('Broadcast error:', err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
