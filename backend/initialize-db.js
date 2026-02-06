const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function initialize() {
    try {
        console.log('Reading schema.sql...');
        const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        console.log('Initializing database schema...');
        // Split by semicolon but watch out for triggers/functions if they exist
        // For schema.sql, running the whole block usually works unless it's too big
        await db.query(sql);
        console.log('Database INITIALIZED successfully ✅');
        process.exit(0);
    } catch (err) {
        console.error('Database INITIALIZATION FAILED ❌');
        console.error(err.message);
        process.exit(1);
    }
}

initialize();
