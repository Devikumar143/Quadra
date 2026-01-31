const { Pool } = require('pg');
require('dotenv').config();

// Use DATABASE_URL from .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const migrate = async () => {
    try {
        console.log('Starting migration...');

        await pool.query(`
            ALTER TABLE tournaments 
            ADD COLUMN IF NOT EXISTS upi_id VARCHAR(50),
            ADD COLUMN IF NOT EXISTS contact_info VARCHAR(20);
        `);

        console.log('✅ Migration successful: Added upi_id and contact_info columns.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        pool.end();
    }
};

migrate();
