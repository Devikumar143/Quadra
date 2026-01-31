const db = require('../config/db');

exports.createPost = async (req, res) => {
    const { team_id, type, description, combat_role_pref } = req.body;
    const user_id = req.user.id;

    try {
        // If it's a squad post (LFM), verify user is leader
        if (type === 'LFM' && team_id) {
            const team = await db.query('SELECT leader_id FROM teams WHERE id = $1', [team_id]);
            if (team.rows.length === 0 || team.rows[0].leader_id !== user_id) {
                return res.status(403).json({ message: 'Only squad leaders can post recruitment calls.' });
            }
        }

        const post = await db.query(
            'INSERT INTO recruitment_posts (user_id, team_id, type, description, combat_role_pref) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, team_id || null, type, description, combat_role_pref]
        );

        res.status(201).json({ message: 'Recruitment transmission broadcasted.', post: post.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Broadcast failure: Connectivity interrupted.' });
    }
};

exports.getPosts = async (req, res) => {
    const { type } = req.query; // 'LFS' or 'LFM'

    try {
        let query = `
            SELECT rp.*, u.ff_ign, u.ff_uid, u.combat_role as user_combat_role, t.name as team_name
            FROM recruitment_posts rp
            JOIN users u ON rp.user_id = u.id
            LEFT JOIN teams t ON rp.team_id = t.id
            WHERE rp.status = 'active'
        `;

        const params = [];
        if (type) {
            query += ` AND rp.type = $1`;
            params.push(type);
        }

        query += ` ORDER BY rp.created_at DESC`;

        const posts = await db.query(query, params);
        res.json(posts.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Intelligence retrieval failed.' });
    }
};

exports.closePost = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        const post = await db.query('SELECT user_id FROM recruitment_posts WHERE id = $1', [id]);
        if (post.rows.length === 0) return res.status(404).json({ message: 'Post not found.' });
        if (post.rows[0].user_id !== user_id) return res.status(403).json({ message: 'Unauthorized.' });

        await db.query('UPDATE recruitment_posts SET status = $1 WHERE id = $2', ['closed', id]);
        res.json({ message: 'Recruitment transmission terminated.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Termination failed.' });
    }
};
