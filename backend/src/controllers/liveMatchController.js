const db = require('../config/db');

// Helper to calculate win probability and MVP prediction
const calculateAnalytics = (currentScores) => {
    const aliveTeams = currentScores.filter(s => s.status !== 'eliminated');
    if (aliveTeams.length === 0) return { winProbability: {}, mvpPrediction: null };

    // Win Probability Logic
    // Weight factors: Points (0.6), Kills (0.4), Alive Count (2.0 - Strong predictor)
    let totalWeight = 0;
    const weights = aliveTeams.map(s => {
        const aliveCount = s.alive_count ?? 4; // Default to 4 if tracking not started
        const weight = (s.points * 0.6) + (s.kills * 0.4) + (aliveCount * 2.0) + 1;
        totalWeight += weight;
        return { team: s.team, weight };
    });

    const winProbability = {};
    weights.forEach(w => {
        winProbability[w.team] = ((w.weight / totalWeight) * 100).toFixed(1) + '%';
    });

    // MVP Prediction Logic
    let topPlayer = null;
    let maxKills = -1;

    currentScores.forEach(s => {
        if (s.players) {
            Object.entries(s.players).forEach(([name, data]) => {
                if (data.kills > maxKills) {
                    maxKills = data.kills;
                    topPlayer = { name, team: s.team, kills: data.kills };
                } else if (data.kills === maxKills && topPlayer && s.points > (currentScores.find(ts => ts.team === topPlayer.team)?.points || 0)) {
                    topPlayer = { name, team: s.team, kills: data.kills };
                }
            });
        }
    });

    return { winProbability, mvpPrediction: topPlayer };
};

exports.updateLiveMatch = async (req, res) => {
    const { matchId } = req.params;
    const { type, payload } = req.body;
    // Type: 'ticker' | 'score' | 'status' | 'player_kill'
    // Payload: { text: "...", squadId: "...", points: 10, team: "...", player: "..." }

    try {
        if (type === 'score' || type === 'status' || type === 'player_kill') {
            const match = await db.query('SELECT current_scores FROM matches WHERE id = $1', [matchId]);
            let currentScores = match.rows[0]?.current_scores || [];

            const teamName = payload.team;
            let teamData = currentScores.find(s => s.team === teamName);

            if (!teamData) {
                teamData = { team: teamName, points: 0, kills: 0, status: 'alive', alive_count: 4, players: {} };
                currentScores.push(teamData);
            }
            if (!teamData.players) teamData.players = {};

            if (type === 'score') {
                teamData.points = (teamData.points || 0) + (payload.points || 0);
            } else if (type === 'status') {
                teamData.status = payload.status;
            } else if (type === 'player_kill') {
                const { team, player: player_ign, user_id } = payload; // Assuming payload now includes user_id for player_kill

                // 1. Team gets points (usually 1 for a kill, but let's be flexible, default to 1)
                const killPts = payload.points || 1;
                teamData.points = (teamData.points || 0) + killPts;

                // 2. Team Kills increment
                teamData.kills = (teamData.kills || 0) + 1;

                // 3. Player Stats increment in current_scores
                const playerName = payload.player;
                if (!teamData.players[playerName]) {
                    teamData.players[playerName] = { kills: 0 };
                }
                teamData.players[playerName].kills += 1;

                // NOTE: Lifetime stats are updated only upon Verification or Final Result Submission 
                // to ensure accuracy and prevent double counting from live casting errors.
                // Immediate updates are skipped here.
            } else if (type === 'alive_count') {
                teamData.alive_count = payload.count;
            }

            // 1. Update Current Scores
            await db.query('UPDATE matches SET current_scores = $1 WHERE id = $2', [JSON.stringify(currentScores), matchId]);

            // 2. Record Score History Snapshot (Every update for high-fidelity casting)
            const snapshot = {
                timestamp: new Date().toISOString(),
                scores: currentScores.map(s => ({ team: s.team, points: s.points, kills: s.kills, status: s.status }))
            };
            await db.query('UPDATE matches SET score_history = score_history || $1 WHERE id = $2', [JSON.stringify([snapshot]), matchId]);
        }

        // 2. Broadcast to Room
        if (req.io) {
            req.io.to(`match_${matchId}`).emit('live_update', {
                type,
                data: payload,
                matchId,
                timestamp: new Date().toISOString()
            });

            // Auto-emit Ticker for Player Kill
            if (type === 'player_kill') {
                const tickerMsg = `${payload.player} [${payload.team}] eliminated an opponent!`;
                req.io.to(`match_${matchId}`).emit('live_update', {
                    type: 'ticker',
                    data: { text: tickerMsg },
                    matchId,
                    timestamp: new Date().toISOString()
                });
            }

            console.log(`[LIVE] Update emitted to match_${matchId}:`, type);
            res.json({ success: true, message: 'Update broadcasted' });
        } else {
            res.status(500).json({ message: 'Socket service unavailable' });
        }

    } catch (err) {
        console.error('Live Update Error:', err);
        res.status(500).json({ message: 'Server error broadcasting update.' });
    }
};

exports.getLiveMatchState = async (req, res) => {
    const { matchId } = req.params;
    try {
        const matchRes = await db.query('SELECT * FROM matches WHERE id = $1', [matchId]);
        if (matchRes.rows.length === 0) return res.status(404).json({ message: 'Match not found' });

        const match = matchRes.rows[0];

        // Fetch teams AND their roster snapshots
        const registrationsRes = await db.query(`
            SELECT r.team_id, t.name as team_name, r.roster_snapshot
            FROM registrations r
            JOIN teams t ON r.team_id = t.id
            WHERE r.tournament_id = $1 AND r.status = 'approved'
        `, [match.tournament_id]);

        // Enrich with IGNs
        const teams = await Promise.all(registrationsRes.rows.map(async (reg) => {
            const roster = reg.roster_snapshot || []; // [{ user_id, role }]
            if (roster.length > 0) {
                const userIds = roster.map(m => m.user_id);
                const usersRes = await db.query('SELECT id, ff_ign FROM users WHERE id = ANY($1)', [userIds]);

                const fullRoster = roster.map(member => {
                    const user = usersRes.rows.find(u => u.id === member.user_id);
                    return { ...member, ff_ign: user ? user.ff_ign : 'Unknown' };
                });
                return { ...reg, roster: fullRoster };
            }
            return { ...reg, roster: [] };
        }));

        const analytics = calculateAnalytics(match.current_scores || []);

        res.json({
            match: match,
            current_scores: match.current_scores || [],
            score_history: match.score_history || [],
            teams: teams,
            analytics
        });
    } catch (err) {
        console.error('Get Live State Error:', err);
        res.status(500).json({ message: 'Server error fetching live state' });
    }
};

exports.getAllLiveMatches = async (req, res) => {
    try {
        const matchesRes = await db.query(`
            SELECT m.*, t.title as tournament_title, t.sponsor_name, t.sponsor_logo, t.sponsor_message
            FROM matches m
            JOIN tournaments t ON m.tournament_id = t.id
            WHERE m.status = 'live'
            ORDER BY m.scheduled_at ASC
        `);

        if (matchesRes.rows.length === 0) {
            return res.json([]);
        }

        const enrichedMatches = await Promise.all(matchesRes.rows.map(async (match) => {
            const registrationsRes = await db.query(`
                SELECT r.team_id, t.name as team_name, r.roster_snapshot
                FROM registrations r
                JOIN teams t ON r.team_id = t.id
                WHERE r.tournament_id = $1 AND r.status = 'approved'
            `, [match.tournament_id]);

            const teams = await Promise.all(registrationsRes.rows.map(async (reg) => {
                const roster = reg.roster_snapshot || [];
                if (roster.length > 0) {
                    const userIds = roster.map(m => m.user_id);
                    const usersRes = await db.query('SELECT id, ff_ign FROM users WHERE id = ANY($1)', [userIds]);

                    const fullRoster = roster.map(member => {
                        const user = usersRes.rows.find(u => u.id === member.user_id);
                        return { ...member, ff_ign: user ? user.ff_ign : 'Unknown' };
                    });
                    return { ...reg, roster: fullRoster };
                }
                return { ...reg, roster: [] };
            }));

            const analytics = calculateAnalytics(match.current_scores || []);

            return {
                match: match,
                current_scores: match.current_scores || [],
                teams: teams,
                analytics
            };
        }));

        res.json(enrichedMatches);
    } catch (err) {
        console.error('Get All Live Matches Error:', err);
        res.status(500).json({ message: 'Server error fetching live matches' });
    }
};
