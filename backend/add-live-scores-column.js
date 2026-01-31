const db = require('./src/config/db');

const up = async () => {
    try {
        await db.query(`
            ALTER TABLE matches 
            ADD COLUMN IF NOT EXISTS current_scores JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('Successfully added current_scores column to matches table.');
        process.exit(0);
    } catch (err) {
        console.error('Error migrating DB:', err);
        process.exit(1);
    }
};

up();
