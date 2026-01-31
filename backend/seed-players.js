const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: 'postgres://postgres:kumar1234%40@localhost:5432/quadra'
});

async function seed() {
    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash('password123', salt);

        const players = [
            ['Ghost Rider', 'UNI101', '521943021', 'GHOST_FF', 'ghost@university.edu'],
            ['Shadow Ninja', 'UNI102', '992837410', 'SHADOW_X', 'shadow@university.edu'],
            ['Blaze King', 'UNI103', '112233445', 'BLAZE_OP', 'blaze@university.edu']
        ];

        for (const p of players) {
            await pool.query(
                `INSERT INTO users (full_name, university_id, ff_uid, ff_ign, email, password_hash, role, is_verified) 
                 VALUES ($1, $2, $3, $4, $5, $6, 'player', true) 
                 ON CONFLICT (email) DO NOTHING`,
                [...p, password_hash]
            );
        }

        console.log('SUCCESS: Seeded 3 test players.');
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
