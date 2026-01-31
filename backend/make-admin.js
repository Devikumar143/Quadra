const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://postgres:kumar1234%40@localhost:5432/quadra'
});

async function run() {
    try {
        console.log('Granting ADMIN privileges to player@university.edu...');
        const res = await pool.query(
            "UPDATE users SET role = 'admin' WHERE email = 'player@university.edu'"
        );
        if (res.rowCount > 0) {
            console.log('SUCCESS: Demo user is now an Admin.');
        } else {
            console.log('User not found.');
        }
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

run();
