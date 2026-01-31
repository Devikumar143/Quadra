const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://postgres:kumar1234@127.0.0.1:5432/quadra'
});

async function run() {
    try {
        console.log('Testing 127.0.0.1 with kumar1234...');
        await pool.query('SELECT 1');
        console.log('SUCCESS!');
    } catch (err) {
        console.error('FAILED:', err.message);
    } finally {
        await pool.end();
    }
}

run();
