const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migrate-gamer-passport.sql'), 'utf8');
        console.log('Running migration...');
        await db.query(sql);
        console.log('Migration COMPLETED successfully ✅');
        process.exit(0);
    } catch (err) {
        console.error('Migration FAILED ❌');
        console.error(err.message);
        process.exit(1);
    }
}

migrate();
