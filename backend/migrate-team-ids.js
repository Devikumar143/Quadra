const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'quadra',
    password: 'kumar1234@', // Based on migrate-tournament-ids.js
    port: 5432,
});

const generateTeamId = () => {
    // Generate random 10-digit number (1000000000 to 9999999999)
    return Math.floor(1000000000 + Math.random() * 9000000000);
};

async function migrateTeamIds() {
    const client = await pool.connect();

    try {
        console.log('Starting Team ID migration to 10-digit format...\n');

        await client.query('BEGIN');

        // Step 1: Create a mapping table for old UUID to new ID
        console.log('Step 1: Creating ID mapping...');
        const teamsRes = await client.query('SELECT id FROM teams ORDER BY created_at');
        const idMapping = new Map();

        for (const row of teamsRes.rows) {
            let newId;
            let isUnique = false;
            while (!isUnique) {
                newId = generateTeamId();
                // Check if this ID was already generated in this session
                if (!Array.from(idMapping.values()).includes(newId)) {
                    isUnique = true;
                }
            }
            idMapping.set(row.id, newId);
            console.log(`  ${row.id} -> ${newId}`);
        }

        // Step 2: Add temporary column for new IDs
        console.log('\nStep 2: Adding temporary ID column...');
        await client.query('ALTER TABLE teams ADD COLUMN new_id BIGINT');
        await client.query('ALTER TABLE team_members ADD COLUMN new_team_id BIGINT');
        await client.query('ALTER TABLE registrations ADD COLUMN new_team_id BIGINT');
        await client.query('ALTER TABLE match_results ADD COLUMN new_team_id BIGINT');
        await client.query('ALTER TABLE squad_messages ADD COLUMN new_team_id BIGINT');

        // Step 3: Populate new IDs
        console.log('Step 3: Populating new IDs...');
        for (const [oldId, newId] of idMapping) {
            await client.query('UPDATE teams SET new_id = $1 WHERE id = $2', [newId, oldId]);
            await client.query('UPDATE team_members SET new_team_id = $1 WHERE team_id = $2', [newId, oldId]);
            await client.query('UPDATE registrations SET new_team_id = $1 WHERE team_id = $2', [newId, oldId]);
            await client.query('UPDATE match_results SET new_team_id = $1 WHERE team_id = $2', [newId, oldId]);
            await client.query('UPDATE squad_messages SET new_team_id = $1 WHERE team_id = $2', [newId, oldId]);
        }

        // Step 4: Drop old foreign key constraints
        console.log('Step 4: Dropping old constraints...');
        await client.query('ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_team_id_fkey');
        await client.query('ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_team_id_fkey');
        await client.query('ALTER TABLE match_results DROP CONSTRAINT IF EXISTS match_results_team_id_fkey');
        await client.query('ALTER TABLE squad_messages DROP CONSTRAINT IF EXISTS squad_messages_team_id_fkey');

        // Step 5: Drop old columns and rename new ones
        console.log('Step 5: Swapping columns...');
        await client.query('ALTER TABLE teams DROP COLUMN id CASCADE'); // Cascade to handle PK references
        await client.query('ALTER TABLE teams RENAME COLUMN new_id TO id');
        await client.query('ALTER TABLE teams ADD PRIMARY KEY (id)');

        await client.query('ALTER TABLE team_members DROP COLUMN team_id');
        await client.query('ALTER TABLE team_members RENAME COLUMN new_team_id TO team_id');
        await client.query('ALTER TABLE team_members ADD PRIMARY KEY (team_id, user_id)');

        await client.query('ALTER TABLE registrations DROP COLUMN team_id');
        await client.query('ALTER TABLE registrations RENAME COLUMN new_team_id TO team_id');

        await client.query('ALTER TABLE match_results DROP COLUMN team_id');
        await client.query('ALTER TABLE match_results RENAME COLUMN new_team_id TO team_id');

        await client.query('ALTER TABLE squad_messages DROP COLUMN team_id');
        await client.query('ALTER TABLE squad_messages RENAME COLUMN new_team_id TO team_id');

        // Step 6: Re-add foreign key constraints
        console.log('Step 6: Re-adding foreign key constraints...');
        await client.query('ALTER TABLE team_members ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE');
        await client.query('ALTER TABLE registrations ADD CONSTRAINT registrations_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE');
        await client.query('ALTER TABLE match_results ADD CONSTRAINT match_results_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE');
        await client.query('ALTER TABLE squad_messages ADD CONSTRAINT squad_messages_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE');

        await client.query('COMMIT');
        console.log('\n✅ Migration completed successfully!');
        console.log(`Migrated ${idMapping.size} team(s) to 10-digit IDs`);

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('\n❌ Migration failed:', err.message);
        console.error('Full error:', err);
    } finally {
        if (client) client.release();
        pool.end();
    }
}

migrateTeamIds();
