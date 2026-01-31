const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'quadra',
    password: '', // Providing empty string
    port: 5432,
});

async function run() {
    try {
        const res = await pool.query('SELECT current_user');
        console.log('Success! User:', res.rows[0]);
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

run();
