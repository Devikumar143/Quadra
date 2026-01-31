const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:kumar1234%40@localhost:5432/quadra' });

async function checkRelations() {
    try {
        console.log("Checking relations...");
        const regs = await pool.query("SELECT * FROM registrations");
        for (const reg of regs.rows) {
            console.log(`Checking Reg ID: ${reg.id}`);

            const team = await pool.query("SELECT name FROM teams WHERE id = $1", [reg.team_id]);
            console.log(`- Team (${reg.team_id}): ${team.rows.length > 0 ? 'FOUND (' + team.rows[0].name + ')' : 'MISSING'}`);

            const tournament = await pool.query("SELECT title FROM tournaments WHERE id = $1", [reg.tournament_id]);
            console.log(`- Tournament (${reg.tournament_id}): ${tournament.rows.length > 0 ? 'FOUND (' + tournament.rows[0].title + ')' : 'MISSING'}`);
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

checkRelations();
