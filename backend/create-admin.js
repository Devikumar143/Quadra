const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        const email = 'admin@quadra.com';
        const password = 'adminpassword';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            console.log('Admin user exists. Updating role and password...');
            await pool.query('UPDATE users SET password_hash = $1, role = $2 WHERE email = $3', [hash, 'admin', email]);
        } else {
            console.log('Creating admin account...');
            await pool.query(
                `INSERT INTO users (full_name, university_id, ff_uid, ff_ign, email, password_hash, role, is_verified) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                ['System Admin', 'ADMIN-001', '0000000001', 'QUADRA_ADMIN', email, hash, 'admin', true]
            );
        }
        console.log('Admin account ready: admin@quadra.com / adminpassword');
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

run();
