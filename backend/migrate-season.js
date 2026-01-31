const pool = require('./src/config/db');

module.exports = async function migrate() {
    console.log('Running migration: Seasonal Snapshots');
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS seasonal_snapshots (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                season_label VARCHAR(100) NOT NULL,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                final_rank INT NOT NULL,
                final_stats JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Migration complete: Seasonal Snapshots');
    } catch (err) {
        console.error('Migration failed:', err.message);
    }
};

if (require.main === module) {
    module.exports().then(() => process.exit());
}
