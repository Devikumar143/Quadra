const db = require('./src/config/db');

async function initializeReferrals() {
    try {
        const users = await db.query("SELECT id FROM users WHERE referral_code IS NULL");
        console.log(`Initializing referral codes for ${users.rowCount} users...`);

        for (const user of users.rows) {
            const code = 'QD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            await db.query("UPDATE users SET referral_code = $1 WHERE id = $2", [code, user.id]);
        }

        console.log('Referral codes initialized successfully ✅');
        process.exit(0);
    } catch (err) {
        console.error('Initialization FAILED ❌');
        console.error(err.message);
        process.exit(1);
    }
}

initializeReferrals();
