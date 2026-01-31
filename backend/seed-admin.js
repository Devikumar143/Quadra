const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    try {
        const email = 'admin@quadra.com';
        const password = 'admin';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if exists
        const check = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (check.rows.length > 0) {
            console.log('Admin user exists. Updating password and role...');
            await db.query(`
                UPDATE users 
                SET password_hash = $1, role = 'admin', is_verified = TRUE 
                WHERE email = $2
            `, [hashedPassword, email]);
        } else {
            console.log('Creating new admin user...');
            await db.query(`
                INSERT INTO users (full_name, university_id, ff_uid, ff_ign, email, password_hash, role, is_verified)
                VALUES ($1, $2, $3, $4, $5, $6, 'admin', TRUE)
            `, ['System Admin', 'ADMIN001', 'ADMIN_UID', 'SYS_ADMIN', email, hashedPassword]);
        }

        console.log('✅ Admin initialized: admin@quadra.com / admin');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedAdmin();
