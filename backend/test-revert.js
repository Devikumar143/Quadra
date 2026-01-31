const { Pool } = require('pg');

// EXACT same string that worked in Step 431
const pool = new Pool({
    connectionString: 'postgres://postgres@localhost:5432/quadra'
});

async function run() {
    try {
        console.log('Testing connection string...');
        const res = await pool.query('SELECT current_database(), current_user');
        console.log('Connected:', res.rows[0]);

        const tables = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        console.log('Tables:', tables.rows.map(r => r.tablename));
    } catch (err) {
        console.error('FAILED AGAIN:', err);
    } finally {
        await pool.end();
    }
}

run();
