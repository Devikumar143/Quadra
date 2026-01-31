const db = require('../config/db');
const crypto = require('crypto');

// Generate a unique 10-digit team ID
const generateTeamId = () => {
    // Generate random 10-digit number (1000000000 to 9999999999)
    return Math.floor(1000000000 + Math.random() * 9000000000);
};

exports.createTeam = async (req, res) => {
    const { name } = req.body;
    const leader_id = req.user.id;

    try {
        // Check if user is already in a team (simple check for now)
        const existingMember = await db.query('SELECT * FROM team_members WHERE user_id = $1', [leader_id]);
        if (existingMember.rows.length > 0) {
            return res.status(400).json({ message: 'You are already a member of a team.' });
        }

        const invite_code = crypto.randomBytes(4).toString('hex').toUpperCase();
        const teamId = generateTeamId();

        const newTeam = await db.query(
            'INSERT INTO teams (id, name, leader_id, invite_code, upi_id, mobile_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [teamId, name, leader_id, invite_code, req.body.upi_id || null, req.body.mobile_number || null]
        );

        await db.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
            [newTeam.rows[0].id, leader_id, 'leader']
        );

        res.status(201).json(newTeam.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during team creation.' });
    }
};

exports.joinTeam = async (req, res) => {
    const { invite_code } = req.body;
    const user_id = req.user.id;

    try {
        const team = await db.query('SELECT * FROM teams WHERE invite_code = $1', [invite_code]);
        if (team.rows.length === 0) {
            return res.status(404).json({ message: 'Invalid invite code.' });
        }

        const team_id = team.rows[0].id;

        // Check capacity (4 + 1 sub)
        const members = await db.query('SELECT * FROM team_members WHERE team_id = $1', [team_id]);
        if (members.rows.length >= 5) {
            return res.status(400).json({ message: 'Team is full.' });
        }

        // Check if user already in a team
        const existingMember = await db.query('SELECT * FROM team_members WHERE user_id = $1', [user_id]);
        if (existingMember.rows.length > 0) {
            return res.status(400).json({ message: 'You are already in a team.' });
        }

        await db.query(
            'INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)',
            [team_id, user_id, 'member']
        );

        res.json({ message: 'Successfully joined team.', team: team.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during joining team.' });
    }
};

exports.getTeamDetails = async (req, res) => {
    try {
        const teamId = req.params.id;
        const team = await db.query('SELECT * FROM teams WHERE id = $1', [teamId]);
        if (team.rows.length === 0) return res.status(404).json({ message: 'Team not found' });

        const members = await db.query(
            'SELECT u.id, u.full_name, u.ff_ign, u.ff_uid, tm.role FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = $1',
            [teamId]
        );

        res.json({ ...team.rows[0], members: members.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching team details.' });
    }
};

exports.getMyTeam = async (req, res) => {
    try {
        const userId = req.user.id;
        const membership = await db.query('SELECT team_id FROM team_members WHERE user_id = $1', [userId]);

        if (!membership.rows || membership.rows.length === 0) {
            return res.json(null);
        }

        const teamId = membership.rows[0].team_id;
        const teamRes = await db.query('SELECT * FROM teams WHERE id = $1', [teamId]);

        if (teamRes.rows.length === 0) {
            return res.json(null);
        }

        const memberRes = await db.query(
            'SELECT u.id, u.full_name, u.ff_ign, u.ff_uid, tm.role FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = $1',
            [teamId]
        );

        res.json({ ...teamRes.rows[0], members: memberRes.rows });
    } catch (err) {
        console.error('CRITICAL getMyTeam Error:', err);
        res.status(500).json({
            message: 'Squad Intelligence Error',
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

exports.getTeamPerformance = async (req, res) => {
    try {
        const teamId = req.params.id;

        // Fetch members and their stats
        const members = await db.query(
            'SELECT u.id, u.full_name, u.ff_ign, u.stats FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = $1',
            [teamId]
        );

        if (members.rows.length === 0) {
            return res.status(404).json({ message: 'No members found for this team.' });
        }

        let totalKD = 0;
        let totalWinRate = 0;
        let topPerformer = null;
        let maxKD = -1;

        members.rows.forEach(m => {
            const stats = m.stats || {};
            const kd = parseFloat(stats.kd_ratio) || 0;
            const winRate = parseFloat(stats.win_rate) || 0;

            totalKD += kd;
            totalWinRate += winRate;

            if (kd > maxKD) {
                maxKD = kd;
                topPerformer = { id: m.id, ign: m.ff_ign, kd: kd };
            }
        });

        // Fetch recent match history for unit records
        const historyRes = await db.query(`
            SELECT 
                mr.kills, 
                mr.placement, 
                mr.created_at,
                m.map_name,
                t.title as tournament_title
            FROM match_results mr
            JOIN matches m ON mr.match_id = m.id
            JOIN tournaments t ON m.tournament_id = t.id
            WHERE mr.team_id = $1 AND mr.is_verified = TRUE 
            ORDER BY mr.created_at DESC 
            LIMIT 10
        `, [teamId]);

        const performance = {
            avg_kd: (totalKD / members.rows.length).toFixed(2),
            avg_win_rate: (totalWinRate / members.rows.length).toFixed(2) + '%',
            member_count: members.rows.length,
            top_performer: topPerformer,
            synergy_score: Math.min(100, (members.rows.length * 20)).toString() + '%',
            match_history: historyRes.rows.reverse() // Oldest to newest for chart
        };

        res.json(performance);
    } catch (err) {
        console.error('getTeamPerformance Error:', err);
        res.status(500).json({ message: 'Error calculating unit performance.' });
    }
};

exports.leaveTeam = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if user is in a team
        const membership = await db.query('SELECT * FROM team_members WHERE user_id = $1', [userId]);
        if (membership.rows.length === 0) {
            return res.status(400).json({ message: 'You are not a member of any squad.' });
        }

        const { team_id, role } = membership.rows[0];

        // Leaders cannot leave, they must disband
        if (role === 'leader') {
            return res.status(400).json({ message: 'Unit Leaders cannot leave. You must disband the unit or transfer command.' });
        }

        await db.query('DELETE FROM team_members WHERE user_id = $1', [userId]);
        res.json({ message: 'Successfully left the squad.' });
    } catch (err) {
        console.error('leaveTeam Error:', err);
        res.status(500).json({ message: 'Failed to leave squad.' });
    }
};

exports.deleteTeam = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const userId = req.user.id;
        console.log(`[DISBAND] User ${userId} initiating disband...`);

        // Check if user is leader of a team
        const team = await client.query('SELECT * FROM teams WHERE leader_id = $1', [userId]);
        if (team.rows.length === 0) {
            return res.status(403).json({ message: 'Only the Unit Leader can disband the squad.' });
        }

        const teamId = team.rows[0].id;
        console.log(`[DISBAND] Found Team ID: ${teamId}`);

        // Delete the team (ON DELETE CASCADE handles members and results)
        await client.query('BEGIN');
        await client.query('DELETE FROM teams WHERE id = $1', [teamId]);
        await client.query('COMMIT');

        console.log(`[DISBAND] Success for Team ${teamId}`);
        res.json({ message: 'Squad successfully disbanded.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('deleteTeam Error:', err);
        res.status(500).json({ message: 'Failed to disband squad.' });
    } finally {
        client.release();
    }
};

exports.getMessages = async (req, res) => {
    try {
        const teamId = req.params.id;

        // Security Check: Ensure user belongs to this team
        const membership = await db.query('SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, req.user.id]);
        if (membership.rows.length === 0) {
            return res.status(403).json({ message: 'Unauthorized. You are not a member of this unit.' });
        }

        const result = await db.query(`
            SELECT sm.*, u.ff_ign 
            FROM squad_messages sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.team_id = $1
            ORDER BY sm.created_at DESC
            LIMIT 50
        `, [teamId]);

        res.json(result.rows.reverse()); // Return oldest to newest for UI
    } catch (err) {
        console.error('getMessages Error:', err);
        res.status(500).json({ message: 'Failed to retrieve comms.' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const teamId = req.params.id;
        const { content, type } = req.body;

        // Security Check
        const membership = await db.query('SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, req.user.id]);
        if (membership.rows.length === 0) {
            return res.status(403).json({ message: 'Unauthorized transmission.' });
        }

        const result = await db.query(`
            INSERT INTO squad_messages (team_id, user_id, content, type)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [teamId, req.user.id, content, type || 'chat']);

        // Enrich response with sender info for immediate UI update
        const sender = await db.query('SELECT ff_ign FROM users WHERE id = $1', [req.user.id]);

        res.json({ ...result.rows[0], ff_ign: sender.rows[0].ff_ign });
    } catch (err) {
        console.error('sendMessage Error:', err);
        res.status(500).json({ message: 'Transmission failed.' });
    }
};

exports.updateTeam = async (req, res) => {
    try {
        const teamId = req.params.id;
        const { name, upi_id, mobile_number } = req.body;
        const userId = req.user.id;

        // Security Check: Only Leader can update
        const membership = await db.query('SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, userId]);
        if (membership.rows.length === 0 || membership.rows[0].role !== 'leader') {
            return res.status(403).json({ message: 'Only the Squad Leader can update unit details.' });
        }

        const result = await db.query(
            `UPDATE teams 
             SET name = COALESCE($1, name),
                 upi_id = COALESCE($2, upi_id),
                 mobile_number = COALESCE($3, mobile_number)
             WHERE id = $4 
             RETURNING *`,
            [name, upi_id, mobile_number, teamId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Team not found.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('updateTeam Error:', err);
        res.status(500).json({ message: 'Server error updating team.' });
    }
};

exports.getAllTeams = async (req, res) => {
    // Admin check is handled in route middleware or here
    // Let's assume route middleware checks for admin role, but good to be safe if generic auth is used
    /* if (req.user.role !== 'admin') { 
        // This usually handled by route middleware for better separation
    } */

    try {
        const teams = await db.query('SELECT * FROM teams ORDER BY created_at DESC');

        // Enhance with member counts
        const enhancedTeams = await Promise.all(teams.rows.map(async (team) => {
            const members = await db.query(
                'SELECT u.id, u.full_name, u.ff_ign, tm.role, u.stats FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = $1',
                [team.id]
            );
            return {
                ...team,
                member_count: members.rows.length,
                members: members.rows
            };
        }));

        res.json(enhancedTeams);
    } catch (err) {
        console.error('getAllTeams Error:', err);
        res.status(500).json({ message: 'Failed to fetch squad registry.' });
    }
};
