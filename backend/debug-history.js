const db = require('./src/config/db');

async function debugHistory() {
    try {
        console.log('Connecting to DB...');
        // get any user
        const userRes = await db.query("SELECT id, ff_ign FROM users LIMIT 1");
        if (userRes.rows.length === 0) {
            console.log('No users found');
            process.exit(0);
        }
        const userId = userRes.rows[0].id;
        console.log(`Testing history for user: ${userRes.rows[0].ff_ign} (${userId})`);

        console.time('QueryTime');
        const result = await db.query(`
            SELECT
                mr.id as result_id,
                mr.kills,
                mr.placement,
                mr.total_points,
                mr.created_at,
                m.map_name,
                t.title as tournament_title,
                t.id as tournament_id
            FROM match_results mr
            JOIN matches m ON mr.match_id = m.id
            JOIN tournaments t ON m.tournament_id = t.id
            JOIN team_members tm ON mr.team_id = tm.team_id
            WHERE tm.user_id = $1
            ORDER BY mr.created_at DESC
            LIMIT 50
        `, [userId]);
        console.timeEnd('QueryTime');

        console.log(`Found ${result.rows.length} records.`);
        console.log(result.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

debugHistory();
