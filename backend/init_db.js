const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initDB() {
    try {
        await client.connect();
        console.log('Connected to database...');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema.sql...');
        await client.query(schemaSql);
        console.log('Schema applied successfully.');

        // Check if we need to run migrations
        // For now, schema.sql seems to contain the "Gamer Passport" fields, 
        // so migrate-gamer-passport.sql might be redundant if schema.sql is fresh.
        // Let's run it just in case, relying on IF NOT EXISTS.

        const passportMigrationPath = path.join(__dirname, 'migrate-gamer-passport.sql');
        if (fs.existsSync(passportMigrationPath)) {
            console.log('Executing migrate-gamer-passport.sql...');
            const passportSql = fs.readFileSync(passportMigrationPath, 'utf8');
            await client.query(passportSql);
            console.log('Gamer passport migration applied.');
        }

    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await client.end();
        console.log('Disconnected.');
    }
}

initDB();
