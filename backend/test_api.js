const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:kumar1234%40@localhost:5432/quadra' });

async function testApiLogic(tournamentId) {
    try {
        console.log(`Testing API logic for Tournament ID: ${tournamentId}`);
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
        const results = await pool.query(query, [tournamentId]);
        console.log("Results Found:", results.rowCount);
        console.log("Data:", JSON.stringify(results.rows, null, 2));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

// Test with the ID found in DB
testApiLogic('5823550595');
