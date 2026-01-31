const db = require('./src/config/db');

const up = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS disputes (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                result_id UUID REFERENCES match_results(id) ON DELETE CASCADE,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                reason TEXT NOT NULL,
                evidence_url TEXT,
                status VARCHAR(20) DEFAULT 'open', -- 'open', 'resolved', 'dismissed'
                admin_response TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Disputes table created successfully with UUID compatibility.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
};

up();
