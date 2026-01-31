const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://postgres:kumar1234%40@localhost:5432/quadra'
});

async function run() {
    try {
        console.log('Seeding Sample Tournament...');

        const check = await pool.query('SELECT * FROM tournaments LIMIT 1');
        if (check.rows.length === 0) {
            await pool.query(
                `INSERT INTO tournaments (title, description, format, status, registration_deadline, start_date, scoring_params) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    'Obsidian Cup: Season 1',
                    'The ultimate university showdown. Premium rewards for the top 3 squads.',
                    'qualifiers',
                    'open',
                    '2026-02-01',
                    '2026-02-10',
                    JSON.stringify({ kill_points: 1, placement_points: { 1: 12, 2: 9, 3: 8 } })
                ]
            );
            console.log('Success! Tournament created.');
        } else {
            console.log('Tournaments already exist in the arena.');
        }
    } catch (err) {
        console.error('FAILED:', err.message);
    } finally {
        await pool.end();
    }
}

run();
