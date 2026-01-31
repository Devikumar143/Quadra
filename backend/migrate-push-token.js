const db = require('./src/config/db');

async function migratePushToken() {
    try {
        console.log('🚀 Starting Push Token Migration...');

        // Add push_token column to users table
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS push_token VARCHAR(255);
        `);
        console.log('✅ Added push_token column to users table.');

        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migratePushToken();
