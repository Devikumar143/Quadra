const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:kumar1234%40@localhost:5432/quadra' });

async function migrate() {
    try {
        console.log("Starting migration...");
        // Add transaction_id column if it doesn't exist
        await pool.query("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS transaction_id TEXT;");
        console.log("Added transaction_id column.");

        // Ensure status column exists and has default 'pending' (if not already)
        // Note: altering default value might be needed if it was different
        await pool.query("ALTER TABLE registrations ALTER COLUMN status SET DEFAULT 'pending';");
        console.log("Updated default status to pending.");

        console.log("Migration successful.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await pool.end();
    }
}

migrate();
