const db = require('./src/config/db');

async function createDummyHistory() {
    try {
        console.log('Connecting to database...');

        // 1. Get a user and their team
        const userRes = await db.query(`
            SELECT tm.user_id, tm.team_id, u.full_name 
            FROM team_members tm 
            JOIN users u ON tm.user_id = u.id 
            LIMIT 1
        `);

        if (userRes.rows.length === 0) {
            console.log('No users with teams found.');
            return;
        }

        const { user_id, team_id, full_name } = userRes.rows[0];
        console.log(`Found User: ${full_name} (ID: ${user_id}) in Team ${team_id}`);

        // 2. Get a match
        const matchRes = await db.query('SELECT id, tournament_id FROM matches LIMIT 1');
        if (matchRes.rows.length === 0) {
            console.log('No matches found. Please create a tournament and match first.');
            return;
        }

        const { id: match_id, tournament_id } = matchRes.rows[0];
        console.log(`Found Match: ${match_id} in Tournament ${tournament_id}`);

        // 3. Insert Result
        const result = await db.query(`
            INSERT INTO match_results (match_id, team_id, kills, placement, total_points, is_verified, verified_by)
            VALUES ($1, $2, $3, $4, $5, TRUE, $6)
            RETURNING *
        `, [match_id, team_id, 12, 1, 25, user_id]);

        console.log('Dummy Result Created:', result.rows[0]);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

createDummyHistory();
