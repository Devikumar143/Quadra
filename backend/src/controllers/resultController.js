const db = require('../config/db');
const achievementController = require('./achievementController');
const tournamentService = require('../services/tournamentService');

exports.submitResult = async (req, res) => {
    const { match_id, team_id, kills, placement, screenshot_url } = req.body;
    const user_id = req.user.id;

    try {
        // Check if team is registered for this match's tournament
        const match = await db.query('SELECT tournament_id FROM matches WHERE id = $1', [match_id]);
        if (match.rows.length === 0) return res.status(404).json({ message: 'Match not found' });

        const registration = await db.query(
            'SELECT * FROM registrations WHERE tournament_id = $1 AND team_id = $2',
            [match.rows[0].tournament_id, team_id]
        );
        if (registration.rows.length === 0) return res.status(403).json({ message: 'Team not registered for this tournament.' });

        // Calculate points (placeholder logic - should fetch from tournament scoring_params)
        const tournament = await db.query('SELECT scoring_params FROM tournaments WHERE id = $1', [match.rows[0].tournament_id]);
        const params = tournament.rows[0].scoring_params || {};

        const placementPoints = (params.placement_points?.[placement.toString()] !== undefined)
            ? params.placement_points[placement.toString()]
            : Math.max(0, 13 - parseInt(placement || 13));
        const killPoints = (parseInt(kills) || 0) * (params.kill_points || 1);
        const total_points = placementPoints + killPoints;

        const result = await db.query(
            'INSERT INTO match_results (match_id, team_id, kills, placement, total_points, screenshot_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [match_id, team_id, kills, placement, total_points, screenshot_url]
        );

        res.status(201).json({ message: 'Result submitted for verification.', result: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during result submission.' });
    }
};

exports.verifyResult = async (req, res) => {
    const { result_id } = req.params;
    const admin_id = req.user.id;

    try {
        if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
            return res.status(403).json({ message: 'Only admins can verify results.' });
        }

        // Get result details before verification (to ensure it's not already verified)
        const resultCheck = await db.query(`
            SELECT mr.*, t.title as tournament_title, m.round_number 
            FROM match_results mr
            JOIN matches m ON mr.match_id = m.id
            JOIN tournaments t ON m.tournament_id = t.id
            WHERE mr.id = $1
        `, [result_id]);

        if (resultCheck.rows.length === 0) return res.status(404).json({ message: 'Result not found.' });
        if (resultCheck.rows[0].is_verified) return res.status(400).json({ message: 'Result already verified.' });

        const { team_id, kills, placement, tournament_title, round_number } = resultCheck.rows[0];

        // 1. Verify the result
        const { player_results } = resultCheck.rows[0];
        const verification = await db.query(
            'UPDATE match_results SET is_verified = TRUE, verified_by = $1 WHERE id = $2 RETURNING *',
            [admin_id, result_id]
        );

        // 2. Fetch team members to update their lifetime stats
        const members = await db.query('SELECT user_id FROM team_members WHERE team_id = $1', [team_id]);

        for (const member of members.rows) {
            const userRes = await db.query('SELECT stats FROM users WHERE id = $1', [member.user_id]);
            let stats = userRes.rows[0].stats || {};

            // Initialize fields if they don't exist
            let totalKills = parseInt(stats.total_kills) || 0;
            let totalMatches = parseInt(stats.total_matches) || 0;
            let totalWins = parseInt(stats.total_wins) || 0;

            // Use individual kills if recorded, otherwise fallback to 0 (since team total shouldn't be given to everyone)
            const individualKills = (player_results || []).find(pr => pr.user_id === member.user_id)?.kills || 0;

            totalKills += parseInt(individualKills);
            totalMatches += 1;
            if (placement === 1) totalWins += 1;

            const kd = (totalKills / Math.max(totalMatches, 1)).toFixed(2);
            const winRate = ((totalWins / Math.max(totalMatches, 1)) * 100).toFixed(1) + '%';

            const updatedStats = {
                ...stats,
                total_kills: totalKills,
                total_matches: totalMatches,
                total_wins: totalWins,
                kd_ratio: kd,
                win_rate: winRate
            };

            await db.query('UPDATE users SET stats = $1 WHERE id = $2', [JSON.stringify(updatedStats), member.user_id]);

            // NEW: Dispatch context-aware intelligence alert
            await req.notificationService.dispatch(
                member.user_id,
                'VERIFICATION_SUCCESS',
                `Lethality Report Authorized: RD ${round_number} on ${tournament_title}. Stats synced.`
            );

            // NEW: Check for achievement unlocks
            await achievementController.checkAchievements(member.user_id);
        }

        // NEW: Trigger tournament progression check
        const matchResForProg = await db.query('SELECT tournament_id FROM matches WHERE id = $1', [resultCheck.rows[0].match_id]);
        if (matchResForProg.rows.length > 0) {
            await tournamentService.advanceStage(matchResForProg.rows[0].tournament_id);
        }

        res.json({
            message: 'Result verified and stats synchronized across squad.',
            result: verification.rows[0]
        });
    } catch (err) {
        console.error('Verification Error:', err);
        res.status(500).json({ message: 'Server error during verification.' });
    }
};

exports.getPendingResults = async (req, res) => {
    try {
        const results = await db.query(
            `SELECT mr.*, t.name as team_name, m.round_number, m.map_name, tr.title as tournament_title 
             FROM match_results mr 
             JOIN teams t ON mr.team_id = t.id 
             JOIN matches m ON mr.match_id = m.id 
             JOIN tournaments tr ON m.tournament_id = tr.id 
             WHERE mr.is_verified = FALSE 
             ORDER BY mr.created_at ASC`
        );
        res.json(results.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching pending results.' });
    }
};

exports.bulkSubmit = async (req, res) => {
    const { results } = req.body; // Array of { match_id, team_id, kills, placement }
    const admin_id = req.user.id;

    if (!Array.isArray(results) || results.length === 0) {
        return res.status(400).json({ message: 'Invalid or empty results array.' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        for (const data of results) {
            const { match_id, team_id, kills, placement, player_results } = data;

            // 1. Get Match and Tournament Info
            const matchRes = await client.query(`
                SELECT m.id, m.tournament_id, m.round_number, t.title as tournament_title, t.scoring_params
                FROM matches m
                JOIN tournaments t ON m.tournament_id = t.id
                WHERE m.id = $1
            `, [match_id]);

            if (matchRes.rows.length === 0) throw new Error(`Match ${match_id} not found.`);
            const match = matchRes.rows[0];

            // 2. Validate Team Existence & Registration
            const teamRes = await client.query('SELECT name FROM teams WHERE id = $1', [team_id]);
            if (teamRes.rows.length === 0) {
                throw new Error(`Team ID ${team_id} not found in database.`);
            }

            const registration = await client.query(
                'SELECT * FROM registrations WHERE tournament_id = $1 AND team_id = $2 AND status = \'approved\'',
                [match.tournament_id, team_id]
            );

            // Allow override if manual override is needed, but warn for now. 
            // Better to enforce:
            if (registration.rows.length === 0) {
                throw new Error(`Team ${teamRes.rows[0].name} (${team_id}) is not approved for this tournament.`);
            }

            // 3. Calculate points
            const params = match.scoring_params || {};
            const placementPoints = (params.placement_points?.[placement.toString()] !== undefined)
                ? params.placement_points[placement.toString()]
                : Math.max(0, 13 - (parseInt(placement) || 13));
            const killPoints = (parseInt(kills) || 0) * (params.kill_points || 1);
            const total_points = placementPoints + killPoints;

            // 3. Insert Verified Result
            await client.query(
                `INSERT INTO match_results (match_id, team_id, kills, placement, total_points, is_verified, verified_by, player_results) 
                 VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7)`,
                [match_id, team_id, kills, placement, total_points, admin_id, JSON.stringify(player_results || [])]
            );

            // 4. Update Member Stats & Notify
            const members = await client.query('SELECT user_id FROM team_members WHERE team_id = $1', [team_id]);

            for (const member of members.rows) {
                const userRes = await client.query('SELECT stats FROM users WHERE id = $1', [member.user_id]);
                let stats = userRes.rows[0].stats || {};

                let totalKills = parseInt(stats.total_kills) || 0;
                let totalMatches = parseInt(stats.total_matches) || 0;
                let totalWins = parseInt(stats.total_wins) || 0;

                const individualKills = (player_results || []).find(pr => pr.user_id === member.user_id)?.kills || 0;

                totalKills += parseInt(individualKills);
                totalMatches += 1;
                if (parseInt(placement) === 1) totalWins += 1;

                const kd = (totalKills / Math.max(totalMatches, 1)).toFixed(2);
                const winRate = ((totalWins / Math.max(totalMatches, 1)) * 100).toFixed(1) + '%';

                const updatedStats = {
                    ...stats,
                    total_kills: totalKills,
                    total_matches: totalMatches,
                    total_wins: totalWins,
                    kd_ratio: kd,
                    win_rate: winRate
                };

                await client.query('UPDATE users SET stats = $1 WHERE id = $2', [JSON.stringify(updatedStats), member.user_id]);

                await req.notificationService.dispatch(
                    member.user_id,
                    'VERIFICATION_SUCCESS',
                    `Bulk Intel Synchronized: RD ${match.round_number} on ${match.tournament_title}.`
                );

                // NEW: Check for achievement unlocks
                await achievementController.checkAchievements(member.user_id);
            }
        }

        await client.query('COMMIT');

        // NEW: Trigger tournament progression check
        const firstMatchId = results[0].match_id;

        // Update match status to 'scored' so it disappears from the "Submit Results" list
        await client.query("UPDATE matches SET status = 'scored' WHERE id = $1", [firstMatchId]);

        const matchResForBulk = await client.query('SELECT tournament_id FROM matches WHERE id = $1', [firstMatchId]);
        if (matchResForBulk.rows.length > 0) {
            await tournamentService.advanceStage(matchResForBulk.rows[0].tournament_id);
        }

        res.json({ message: `Successfully processed ${results.length} results.` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Bulk Submit Error:', err);
        res.status(500).json({ message: 'Error during bulk submission: ' + err.message });
    } finally {
        client.release();
    }
};

exports.getTournamentStandings = async (req, res) => {
    const { tournamentId } = req.params;

    try {
        // Get all verified results for this tournament
        const standingsRes = await db.query(`
            SELECT 
                t.id as team_id,
                t.name as team_name,
                SUM(mr.total_points) as total_points,
                SUM(mr.kills) as total_kills,
                COUNT(mr.id) as matches_played
            FROM teams t
            JOIN registrations r ON t.id = r.team_id
            LEFT JOIN match_results mr ON t.id = mr.team_id AND mr.is_verified = TRUE
            JOIN matches m ON mr.match_id = m.id
            WHERE r.tournament_id = $1 AND r.status = 'approved' AND m.tournament_id = $1
            GROUP BY t.id, t.name
            ORDER BY total_points DESC, total_kills DESC
        `, [tournamentId]);

        res.json(standingsRes.rows);
    } catch (err) {
        console.error('Get Tournament Standings Error:', err);
        res.status(500).json({ message: 'Server error fetching standings' });
    }
};

exports.getMatchResults = async (req, res) => {
    const { matchId } = req.params;

    try {
        const resultsRes = await db.query(`
            SELECT 
                mr.*,
                t.name as team_name
            FROM match_results mr
            JOIN teams t ON mr.team_id = t.id
            WHERE mr.match_id = $1 AND mr.is_verified = TRUE
            ORDER BY mr.placement ASC
        `, [matchId]);

        res.json(resultsRes.rows);
    } catch (err) {
        console.error('Get Match Results Error:', err);
        res.status(500).json({ message: 'Server error fetching match results' });
    }
};
