const db = require('./src/config/db');
const notificationService = require('./src/services/notificationService');

async function sendTest() {
    try {
        console.log('🔍 Identifying target operative...');
        const res = await db.query(
            'SELECT id, full_name, push_token FROM users WHERE push_token IS NOT NULL ORDER BY updated_at DESC LIMIT 1'
        );

        if (res.rowCount === 0) {
            console.error('❌ No operatives found with a valid push token.');
            process.exit(1);
        }

        const user = res.rows[0];
        console.log(`🎯 Target Locked: ${user.full_name} (${user.id})`);
        console.log(`🎟️ Token: ${user.push_token.substring(0, 30)}...`);

        console.log('📡 Dispatching Tactical Alert...');
        await notificationService.sendPushNotification(
            [user.id],
            'TACTICAL ALERT 🚨',
            'Comm-link established. Quadra Push Notifications are now ONLINE.',
            { type: 'test', timestamp: new Date().toISOString() }
        );

        console.log('✅ Alert dispatched to Expo servers.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Transmission Failed:', err);
        process.exit(1);
    }
}

sendTest();
