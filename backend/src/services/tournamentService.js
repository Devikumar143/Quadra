const db = require('../config/db');

class TournamentService {
    /**
     * Advances a tournament to the next stage if conditions are met.
     */
    async advanceStage(tournamentId) {
        try {
            // 1. Get all matches for the tournament
            const matchesRes = await db.query('SELECT * FROM matches WHERE tournament_id = $1 ORDER BY round_number DESC', [tournamentId]);
            const matches = matchesRes.rows;

            if (matches.length === 0) return;

            const latestRound = matches[0].round_number;
            const completedInRound = matches.filter(m => m.round_number === latestRound && (m.status === 'completed' || m.status === 'scored'));
            const totalInRound = matches.filter(m => m.round_number === latestRound).length;

            // If some matches in the current round are NOT completed, we wait
            if (completedInRound.length < totalInRound) {
                console.log(`[Tournament Service] Tournament ${tournamentId} round ${latestRound} still in progress.`);
                return;
            }

            // 2. All matches in current round are done. Determine if we move to next round.
            // For Quadra, we might have a fixed number of rounds (e.g., 3 rounds)
            const tournamentRes = await db.query('SELECT * FROM tournaments WHERE id = $1', [tournamentId]);
            const tournament = tournamentRes.rows[0];

            if (latestRound >= 3) { // Assume 3 rounds for now or add to tournament config
                console.log(`[Tournament Service] Tournament ${tournamentId} reached final round. Closing.`);
                await db.query('UPDATE tournaments SET status = $1 WHERE id = $2', ['completed', tournamentId]);
                return;
            }

            // 3. Prepare next round
            const nextRound = latestRound + 1;
            console.log(`[Tournament Service] Advancing tournament ${tournamentId} to round ${nextRound}`);

            // In a real bracket system, we would filter teams here.
            // For now, we keep all approved teams but just notify them.

            // Trigger automated match creation for next round (Placeholder logic)
            // In a fully automated system, we'd spawn a match with a generated time.
        } catch (err) {
            console.error('[Tournament Service Error]', err.message);
        }
    }
}

module.exports = new TournamentService();
