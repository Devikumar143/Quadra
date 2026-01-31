const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Beginning migration...');
        await client.query('BEGIN');

        // Add upi_id if it doesn't exist
        await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='upi_id') THEN 
          ALTER TABLE teams ADD COLUMN upi_id VARCHAR(50); 
        END IF; 
      END $$;
    `);

        // Add mobile_number if it doesn't exist
        await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='mobile_number') THEN 
          ALTER TABLE teams ADD COLUMN mobile_number VARCHAR(20); 
        END IF; 
      END $$;
    `);

        await client.query('COMMIT');
        console.log('Migration completed successfully: Added upi_id and mobile_number to teams table.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
