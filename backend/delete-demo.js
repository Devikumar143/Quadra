const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://postgres:kumar1234%40@localhost:5432/quadra'
});

async function run() {
    try {
        console.log('Deleting demo account: player@university.edu...');
        const res = await pool.query(
            "DELETE FROM users WHERE email = 'player@university.edu'"
        );
        console.log(`Success: ${res.rowCount} records deleted.`);
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

run();
