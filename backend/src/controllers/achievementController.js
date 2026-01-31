const db = require('../config/db');

exports.getUserAchievements = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(`
            SELECT a.*, ua.unlocked_at
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = $1
            ORDER BY ua.unlocked_at DESC
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllAchievements = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM achievements ORDER BY category, requirement_value');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Internal utility to check and unlock achievements
exports.checkAchievements = async (userId) => {
    try {
        // 1. Get user stats
        const userRes = await db.query('SELECT stats, prestige_points FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0];
        const stats = user.stats || {};

        // 2. Get achievements not yet unlocked
        const lockedAchievements = await db.query(`
            SELECT * FROM achievements 
            WHERE id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = $1)
        `, [userId]);

        for (const achievement of lockedAchievements.rows) {
            let unlock = false;
            const val = parseInt(achievement.requirement_value);

            switch (achievement.requirement_type) {
                case 'kills':
                    if ((stats.total_kills || 0) >= val) unlock = true;
                    break;
                case 'matches':
                    if ((stats.total_matches || 0) >= val) unlock = true;
                    break;
                case 'referrals':
                    // We'd need to count referrals if not in stats
                    const refCount = await db.query('SELECT COUNT(*) FROM users WHERE referral_code IS NOT NULL AND id != $1', [userId]); // Placeholder logic
                    if (parseInt(refCount.rows[0].count) >= val) unlock = true;
                    break;
            }

            if (unlock) {
                await db.query(
                    'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
                    [userId, achievement.id]
                );
                // Award points
                if (achievement.reward_points > 0) {
                    await db.query('UPDATE users SET prestige_points = prestige_points + $1 WHERE id = $2', [achievement.reward_points, userId]);
                }
                console.log(`Achievement Unlocked: ${achievement.title} for user ${userId}`);
            }
        }
    } catch (err) {
        console.error('Achievement Check Error:', err.message);
    }
};
