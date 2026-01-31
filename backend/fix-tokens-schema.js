const db = require('./src/config/db');

const fixTokensTable = async () => {
    try {
        console.log("Fixing Security Schema...");

        await db.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                token TEXT UNIQUE NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Refresh Tokens table CREATED 🛡️");
        process.exit(0);
    } catch (err) {
        console.error("Fix FAILURE:", err.message);
        process.exit(1);
    }
};

fixTokensTable();
