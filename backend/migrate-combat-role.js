const db = require('./src/config/db');

async function migrateCombatRole() {
    try {
        console.log('Adding combat_role column to users table...');
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS combat_role VARCHAR(50) DEFAULT 'OPERATIVE'
        `);
        console.log('Migration COMPLETED ✅');
        process.exit(0);
    } catch (err) {
        console.error('Migration FAILED ❌');
        console.error(err.message);
        process.exit(1);
    }
}

migrateCombatRole();
