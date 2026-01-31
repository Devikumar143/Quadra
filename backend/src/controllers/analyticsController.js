const db = require('../config/db');

exports.getGlobalStats = async (req, res) => {
    try {
        // 1. Total Operatives
        const usersCount = await db.query('SELECT COUNT(*) FROM users WHERE role = $1', ['player']);

        // 2. Active Squads
        const teamsCount = await db.query('SELECT COUNT(*) FROM teams');

        // 3. Missions Completed
        const matchesCount = await db.query("SELECT COUNT(*) FROM matches WHERE status IN ('completed', 'scored')");

        // 4. Total Lethality (Kills)
        const totalKills = await db.query('SELECT SUM((stats->>\'total_kills\')::int) as kills FROM users');

        // 5. Avg operative K/D
        const avgKD = await db.query('SELECT AVG((stats->>\'kd_ratio\')::float) as kd FROM users WHERE (stats->>\'total_matches\')::int > 0');

        res.json({
            operatives: parseInt(usersCount.rows[0].count),
            squads: parseInt(teamsCount.rows[0].count),
            missions: parseInt(matchesCount.rows[0].count),
            totalKills: parseInt(totalKills.rows[0].kills || 0),
            avgKD: parseFloat(avgKD.rows[0].kd || 0).toFixed(2)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Intelligence retrieval failure.' });
    }
};

exports.getTournamentPerformance = async (req, res) => {
    try {
        const data = await db.query(`
            SELECT t.title, COUNT(r.id) as registrations,
            (SELECT COUNT(*) FROM matches m WHERE m.tournament_id = t.id) as matches
            FROM tournaments t
            LEFT JOIN registrations r ON t.id = r.tournament_id
            GROUP BY t.id, t.title
            ORDER BY t.created_at DESC
            LIMIT 5
        `);
        res.json(data.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Mission performance data unavailable.' });
    }
};
