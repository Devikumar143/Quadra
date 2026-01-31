const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://postgres:kumar1234@localhost:5432/quadra'
});

async function run() {
    try {
        console.log('Testing with password kumar1234...');
        const res = await pool.query('SELECT 1');
        console.log('Success!');
    } catch (err) {
        console.error('SERVER MESSAGE:', err.message);
    } finally {
        await pool.end();
    }
}

run();
