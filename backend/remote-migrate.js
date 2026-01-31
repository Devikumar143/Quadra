const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runRemoteMigration() {
    const connectionString = process.argv[2] || process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ Error: No connection string provided.');
        console.log('Usage: node remote-migrate.js "postgres://user:pass@host:port/db"');
        process.exit(1);
    }

    console.log('🚀 Starting Remote Migration on Supabase...');
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Supabase.');

        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

        console.log('📜 Executing Schema...');
        await client.query(schemaSql);

        console.log('✨ Migration SUCCESS: Cloud Database is Ready.');
    } catch (err) {
        console.error('❌ Migration FAILED:', err.message);
        if (err.detail) console.error('Detail:', err.detail);
        if (err.where) console.error('Where:', err.where);
    } finally {
        await client.end();
    }
}

runRemoteMigration();
