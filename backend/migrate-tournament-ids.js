const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'quadra',
    password: 'kumar1234@',
    port: 5432,
});

const generateTournamentId = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000);
};

async function migrateTournamentIds() {
    const client = await pool.connect();

    try {
        console.log('Starting tournament ID migration to 10-digit format...\n');

        await client.query('BEGIN');

        // Step 1: Create a mapping table for old UUID to new ID
        console.log('Step 1: Creating ID mapping...');
        const tournamentsRes = await client.query('SELECT id FROM tournaments ORDER BY created_at');
        const idMapping = new Map();

        tournamentsRes.rows.forEach(row => {
            const newId = generateTournamentId();
            idMapping.set(row.id, newId);
            console.log(`  ${row.id} -> ${newId}`);
        });

        // Step 2: Add temporary column for new IDs
        console.log('\nStep 2: Adding temporary ID column...');
        await client.query('ALTER TABLE tournaments ADD COLUMN new_id BIGINT');
        await client.query('ALTER TABLE matches ADD COLUMN new_tournament_id BIGINT');
        await client.query('ALTER TABLE registrations ADD COLUMN new_tournament_id BIGINT');

        // Step 3: Populate new IDs
        console.log('Step 3: Populating new IDs...');
        for (const [oldId, newId] of idMapping) {
            await client.query('UPDATE tournaments SET new_id = $1 WHERE id = $2', [newId, oldId]);
            await client.query('UPDATE matches SET new_tournament_id = $1 WHERE tournament_id = $2', [newId, oldId]);
            await client.query('UPDATE registrations SET new_tournament_id = $1 WHERE tournament_id = $2', [newId, oldId]);
        }

        // Step 4: Drop old foreign key constraints
        console.log('Step 4: Dropping old constraints...');
        await client.query('ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_tournament_id_fkey');
        await client.query('ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_tournament_id_fkey');

        // Step 5: Drop old columns and rename new ones
        console.log('Step 5: Swapping columns...');
        await client.query('ALTER TABLE tournaments DROP COLUMN id');
        await client.query('ALTER TABLE tournaments RENAME COLUMN new_id TO id');
        await client.query('ALTER TABLE tournaments ADD PRIMARY KEY (id)');

        await client.query('ALTER TABLE matches DROP COLUMN tournament_id');
        await client.query('ALTER TABLE matches RENAME COLUMN new_tournament_id TO tournament_id');

        await client.query('ALTER TABLE registrations DROP COLUMN tournament_id');
        await client.query('ALTER TABLE registrations RENAME COLUMN new_tournament_id TO tournament_id');

        // Step 6: Re-add foreign key constraints
        console.log('Step 6: Re-adding foreign key constraints...');
        await client.query('ALTER TABLE matches ADD CONSTRAINT matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE');
        await client.query('ALTER TABLE registrations ADD CONSTRAINT registrations_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE');

        await client.query('COMMIT');
        console.log('\n✅ Migration completed successfully!');
        console.log(`Migrated ${idMapping.size} tournament(s) to 10-digit IDs`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ Migration failed:', err.message);
        console.error('Full error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrateTournamentIds();
