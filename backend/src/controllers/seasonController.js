const pool = require('../config/db');

exports.archiveSeason = async (req, res) => {
    // Admin only check is assumed to be handled by middleware
    const { seasonLabel, topCount = 100 } = req.body;

    if (!seasonLabel) {
        return res.status(400).json({ message: "Season label is required" });
    }

    try {
        // Fetch top players based on win_rate or similar metric
        // Casting jsonb field to numeric for sorting
        const players = await pool.query(`
            SELECT id, stats FROM users 
            ORDER BY (stats->>'win_rate')::float DESC 
            LIMIT $1
        `, [topCount]);

        const snapshots = players.rows.map((player, index) => {
            return {
                season_label: seasonLabel,
                user_id: player.id,
                final_rank: index + 1,
                final_stats: player.stats
            };
        });

        // Bulk insert logic would go here, for now strictly one by one or simple loop for MVP
        for (const snapshot of snapshots) {
            await pool.query(`
                INSERT INTO seasonal_snapshots (season_label, user_id, final_rank, final_stats)
                VALUES ($1, $2, $3, $4)
            `, [snapshot.season_label, snapshot.user_id, snapshot.final_rank, snapshot.final_stats]);
        }

        res.json({ message: `Archived ${snapshots.length} legends for ${seasonLabel}` });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error during archival" });
    }
};

exports.getSeasons = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT season_label, MIN(created_at) as archived_date 
            FROM seasonal_snapshots 
            GROUP BY season_label 
            ORDER BY archived_date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getSeasonLegends = async (req, res) => {
    const { label } = req.params;
    try {
        const result = await pool.query(`
            SELECT s.*, u.ign, u.avatar 
            FROM seasonal_snapshots s
            JOIN users u ON s.user_id = u.id
            WHERE s.season_label = $1
            ORDER BY s.final_rank ASC
        `, [decodeURIComponent(label)]);

        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
};
