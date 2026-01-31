const db = require('../config/db');

// Generate a unique 10-digit tournament ID
const generateTournamentId = () => {
    // Generate random 10-digit number (1000000000 to 9999999999)
    return Math.floor(1000000000 + Math.random() * 9000000000);
};

exports.createTournament = async (req, res) => {
    const { title, description, format, start_date, end_date, prize_pool, max_teams, scoring_params, prestige_points, map_name, sponsor_name, sponsor_logo, sponsor_message, upi_id, contact_info } = req.body;

    try {
        const tournamentId = generateTournamentId();

        const result = await db.query(
            `INSERT INTO tournaments (id, title, description, format, start_date, end_date, prize_pool, max_teams, scoring_params, prestige_points, map_name, sponsor_name, sponsor_logo, sponsor_message, upi_id, contact_info, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'open') RETURNING *`,
            [tournamentId, title, description, format, start_date, end_date, prize_pool || '₹5,000', max_teams || 12, JSON.stringify(scoring_params), prestige_points || 500, map_name || 'Bermuda', sponsor_name, sponsor_logo, sponsor_message, upi_id, contact_info]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error creating tournament.' });
    }
};

exports.updateTournament = async (req, res) => {
    const { id } = req.params;
    const { title, description, format, start_date, end_date, prize_pool, max_teams, scoring_params, prestige_points, map_name, sponsor_name, sponsor_logo, sponsor_message, upi_id, contact_info, status } = req.body;

    try {
        const result = await db.query(
            `UPDATE tournaments 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 format = COALESCE($3, format),
                 start_date = COALESCE($4, start_date),
                 end_date = COALESCE($5, end_date),
                 prize_pool = COALESCE($6, prize_pool),
                 max_teams = COALESCE($7, max_teams),
                 scoring_params = COALESCE($8, scoring_params),
                 prestige_points = COALESCE($9, prestige_points),
                 map_name = COALESCE($10, map_name),
                 sponsor_name = COALESCE($11, sponsor_name),
                 sponsor_logo = COALESCE($12, sponsor_logo),
                 sponsor_message = COALESCE($13, sponsor_message),
                 upi_id = COALESCE($14, upi_id),
                 contact_info = COALESCE($15, contact_info),
                 status = COALESCE($16, status)
             WHERE id = $17 RETURNING *`,
            [title, description, format, start_date, end_date, prize_pool, max_teams, scoring_params ? JSON.stringify(scoring_params) : null, prestige_points, map_name, sponsor_name, sponsor_logo, sponsor_message, upi_id, contact_info, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Tournament not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update Tournament Error:', err);
        res.status(500).json({ message: 'Server error updating tournament.' });
    }
};

exports.registerTeam = async (req, res) => {
    const { tournament_id, team_id } = req.body;
    const user_id = req.user.id;

    try {
        // Check tournament status
        const tournament = await db.query('SELECT * FROM tournaments WHERE id = $1', [tournament_id]);
        if (tournament.rows.length === 0) return res.status(404).json({ message: 'Tournament not found' });
        if (tournament.rows[0].status !== 'open') return res.status(400).json({ message: 'Registration is not open.' });

        // Check if team exists and user is leader
        const team = await db.query('SELECT * FROM teams WHERE id = $1', [team_id]);
        if (team.rows.length === 0) return res.status(404).json({ message: 'Team not found' });
        if (team.rows[0].leader_id !== user_id) return res.status(403).json({ message: 'Only the team leader can register.' });

        // Check roster (must have 4 members)
        const membersRes = await db.query(`
            SELECT tm.*, u.ff_ign 
            FROM team_members tm 
            JOIN users u ON tm.user_id = u.id 
            WHERE tm.team_id = $1
        `, [team_id]);
        const members = membersRes.rows;

        if (members.length < 4) return res.status(400).json({ message: 'Squad must have at least 4 players.' });

        // Check if any member is already registered in this tournament via another team
        const memberIds = members.map(m => m.user_id);
        const existingParticipation = await db.query(
            'SELECT DISTINCT user_id FROM team_members tm JOIN registrations r ON tm.team_id = r.team_id WHERE r.tournament_id = $1 AND tm.user_id = ANY($2)',
            [tournament_id, memberIds]
        );

        if (existingParticipation.rows.length > 0) {
            return res.status(400).json({ message: 'Some members are already registered in this tournament under a different team.' });
        }

        // Check if tournament has reached maximum capacity
        // Only count 'approved' registrations towards the limit
        const registrationCount = await db.query(
            'SELECT COUNT(*) as count FROM registrations WHERE tournament_id = $1 AND status = $2',
            [tournament_id, 'approved']
        );

        const maxTeams = tournament.rows[0].max_teams || 12;

        if (parseInt(registrationCount.rows[0].count) >= maxTeams) {
            return res.status(400).json({ message: 'Tournament capacity full. Waitlist unavailable.' });
        }

        // Lock roster snapshot
        const roster_snapshot = members.map(m => ({
            user_id: m.user_id,
            role: m.role,
            ff_ign: m.ff_ign
        }));
        const { transaction_id } = req.body;

        if (!transaction_id) {
            return res.status(400).json({ message: 'Payment transaction ID is required.' });
        }

        const registration = await db.query(
            'INSERT INTO registrations (tournament_id, team_id, roster_snapshot, status, transaction_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [tournament_id, team_id, JSON.stringify(roster_snapshot), 'pending', transaction_id]
        );

        res.status(201).json({ message: 'Registration pending verification.', registration: registration.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

exports.getTournaments = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.*,
                (SELECT COUNT(*) FROM registrations r WHERE r.tournament_id = t.id AND r.status = 'approved')::int as registration_count
            FROM tournaments t 
            WHERE LOWER(t.status) != 'completed'
            AND (
                NOT EXISTS (SELECT 1 FROM matches m WHERE m.tournament_id = t.id)
                OR EXISTS (SELECT 1 FROM matches m WHERE m.tournament_id = t.id AND m.status != 'completed')
            )
            ORDER BY t.created_at DESC
        `;
        const results = await db.query(query);
        res.json(results.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching tournaments.' });
    }
};

exports.createMatch = async (req, res) => {
    const tournament_id = req.params.id;
    const { room_id, room_password, map_name, round_number, scheduled_at, status = 'scheduled' } = req.body;

    try {
        const newMatch = await db.query(
            'INSERT INTO matches (tournament_id, room_id, room_password, map_name, round_number, scheduled_at, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [tournament_id, room_id, room_password, map_name, round_number, scheduled_at, status]
        );
        const match = newMatch.rows[0];

        // NEW: Notify all approved squads of the new match deployment
        const registrations = await db.query(
            'SELECT team_id FROM registrations WHERE tournament_id = $1 AND status = $2',
            [tournament_id, 'approved']
        );

        for (const reg of registrations.rows) {
            await req.notificationService.dispatchToSquad(
                reg.team_id,
                'MATCH_DEPLOYED',
                `Mission Intel: Match ${round_number} on ${map_name} has been deployed. Synchronization required.`,
                { matchId: match.id, tournamentId: tournament_id }
            );
        }

        res.status(201).json(match);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error creating match.' });
    }
};

exports.getTournamentMatches = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id; // Will be available if we add auth middleware

    try {
        const matchesRes = await db.query('SELECT * FROM matches WHERE tournament_id = $1 ORDER BY scheduled_at ASC', [id]);
        const matches = matchesRes.rows;

        // If no user, or user not registered, mask credentials
        let isRegistered = false;
        if (userId) {
            const registration = await db.query(`
                SELECT r.id 
                FROM registrations r
                JOIN team_members tm ON r.team_id = tm.team_id
                WHERE r.tournament_id = $1 AND tm.user_id = $2 AND r.status = 'approved'
             `, [id, userId]);
            if (registration.rows.length > 0) isRegistered = true;
        }

        // Admins also see everything (DISABLED FOR VERIFICATION)
        const isAdmin = false; // req.user?.role === 'admin';

        console.log(`[DEBUG] Match Fetch: User=${userId}, Registered=${isRegistered}, Admin=${isAdmin}`);

        const sanitizedMatches = matches.map(m => {
            if (isRegistered || isAdmin) { // strict equality check
                return m;
            } else {
                return { ...m, room_id: null, room_password: null };
            }
        });

        res.json(sanitizedMatches);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching matches.' });
    }
};

exports.getAllMatches = async (req, res) => {
    try {
        const query = `
            SELECT m.*, t.title as tournament_title 
            FROM matches m
            JOIN tournaments t ON m.tournament_id = t.id
            ORDER BY m.scheduled_at DESC
        `;
        const results = await db.query(query);
        res.json(results.rows);
    } catch (err) {
        console.error('getAllMatches Error:', err);
        res.status(500).json({ message: 'Server error fetching global matches.' });
    }
};

exports.getTournamentRegistrations = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT r.*, t.name as team_name, tr.title as tournament_title
            FROM registrations r
            JOIN teams t ON r.team_id = t.id
            JOIN tournaments tr ON r.tournament_id = tr.id
            WHERE r.tournament_id = $1
            ORDER BY 
                CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
                r.created_at ASC
        `;
        const results = await db.query(query, [id]);
        res.json(results.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching registrations.' });
    }
};

exports.getPendingRegistrations = async (req, res) => {
    try {
        const query = `
            SELECT r.*, t.name as team_name, tr.title as tournament_title
            FROM registrations r
            JOIN teams t ON r.team_id = t.id
            JOIN tournaments tr ON r.tournament_id = tr.id
            WHERE r.status = 'pending'
            ORDER BY r.created_at ASC
        `;
        const results = await db.query(query);
        res.json(results.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching registrations.' });
    }
};

exports.verifyRegistration = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        // Enforce Capacity Check ONLY when approving
        if (status === 'approved') {
            const regInfo = await db.query('SELECT tournament_id FROM registrations WHERE id = $1', [id]);
            if (regInfo.rows.length === 0) return res.status(404).json({ message: 'Registration not found' });

            const tournamentId = regInfo.rows[0].tournament_id;
            const tournamentInfo = await db.query('SELECT max_teams FROM tournaments WHERE id = $1', [tournamentId]);
            const maxTeams = tournamentInfo.rows[0].max_teams || 12;

            const countRes = await db.query(
                'SELECT COUNT(*) as count FROM registrations WHERE tournament_id = $1 AND status = $2',
                [tournamentId, 'approved']
            );

            if (parseInt(countRes.rows[0].count) >= maxTeams) {
                return res.status(400).json({ message: 'Tournament capacity full. Cannot approve more teams.' });
            }
        }

        const result = await db.query(
            'UPDATE registrations SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        const registration = result.rows[0];

        // NEW: Dispatch direct alert to the squad leader
        const team = await db.query('SELECT name, leader_id FROM teams WHERE id = $1', [registration.team_id]);
        const tournament = await db.query('SELECT title FROM tournaments WHERE id = $1', [registration.tournament_id]);

        await req.notificationService.dispatch(
            team.rows[0].leader_id,
            'REGISTRATION_UPDATE',
            `Squad Enlistment ${status.toUpperCase()}: ${team.rows[0].name} for ${tournament.rows[0].title}.`,
            { registrationId: id, status }
        );

        res.json({ message: `Registration ${status} successfully.`, registration });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating registration.' });
    }
};

exports.deleteTournament = async (req, res) => {
    const { id } = req.params;
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');


        // 1. Delete Disputes (via Match Results)
        await client.query(`
            DELETE FROM disputes
            WHERE result_id IN (
                SELECT id FROM match_results
                WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = $1)
            )
        `, [id]);

        // 2. Delete Match Results
        await client.query(`
            DELETE FROM match_results
            WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = $1)
        `, [id]);

        // 3. Delete Matches
        await client.query('DELETE FROM matches WHERE tournament_id = $1', [id]);

        // 4. Delete Registrations
        await client.query('DELETE FROM registrations WHERE tournament_id = $1', [id]);

        // 5. Delete Tournament
        const result = await client.query('DELETE FROM tournaments WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            throw new Error('Tournament not found');
        }

        await client.query('COMMIT');
        res.json({ message: 'Tournament and all related data deleted successfully', id });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete Tournament Error:', err);
        if (err.message === 'Tournament not found') {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        res.status(500).json({ message: 'Server error deleting tournament' });
    } finally {
        client.release();
    }
};

exports.getRegistrationCount = async (req, res) => {
    const { id } = req.params;

    try {
        const countRes = await db.query(
            'SELECT COUNT(*) as count FROM registrations WHERE tournament_id = $1 AND status = $2',
            [id, 'approved']
        );

        res.json({ count: parseInt(countRes.rows[0].count) });
    } catch (err) {
        console.error('Get Registration Count Error:', err);
        res.status(500).json({ message: 'Server error fetching registration count' });
    }
};



exports.updateMatchStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'live', 'completed', 'scored'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        const result = await db.query(
            'UPDATE matches SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Match not found.' });
        }

        const match = result.rows[0];

        // NEW: Alert squads if match goes LIVE
        if (status === 'live') {
            const tournament = await db.query('SELECT title FROM tournaments WHERE id = $1', [match.tournament_id]);
            const registrations = await db.query(
                'SELECT team_id FROM registrations WHERE tournament_id = $1 AND status = $2',
                [match.tournament_id, 'approved']
            );

            for (const reg of registrations.rows) {
                await req.notificationService.dispatchToSquad(
                    reg.team_id,
                    'MATCH_LIVE',
                    `CRITICAL: Mission on ${tournament.rows[0].title} is now LIVE. Deploy immediately.`,
                    { matchId: id }
                );
            }
        }

        res.json({ message: `Match status updated to ${status.toUpperCase()}`, match });
    } catch (err) {
        console.error('Update Match Status Error:', err);
        res.status(500).json({ message: 'Server error updating match status.' });
    }
};
