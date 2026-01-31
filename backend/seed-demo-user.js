const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: 'postgres://postgres:kumar1234%40@localhost:5432/quadra'
});

async function run() {
    try {
        console.log('Connecting to Quadra database...');

        const email = 'player@university.edu';
        const password = 'password123';

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // First, check if the users table exists (if we need to run schema)
        try {
            await pool.query('SELECT 1 FROM users LIMIT 1');
        } catch (e) {
            console.log('Users table missing. You might need to run schema.sql.');
            // I won't run it automatically here to avoid accidental overrides, 
            // but I'll check first.
        }

        const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            console.log('Demo user exists. Updating credentials...');
            await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);
            console.log('Update Success.');
        } else {
            console.log('Creating fresh demo account...');
            await pool.query(
                `INSERT INTO users (full_name, university_id, ff_uid, ff_ign, email, password_hash, role) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                ['Demo Alpha', 'UNIV-DEMO-001', '1234567890', 'ALPHA_PLAYER', email, hash, 'player']
            );
            console.log('Creation Success.');
        }
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

run();
