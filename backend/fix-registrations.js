const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'quadra',
    password: 'kumar1234@',
    port: 5432,
});

async function fixRegistrations() {
    const client = await pool.connect();
    try {
        console.log('--- STARTING REGISTRATION DATA REPAIR ---');
        const regs = await client.query('SELECT id, team_id, roster_snapshot FROM registrations');

        for (const reg of regs.rows) {
            let roster = reg.roster_snapshot;
            if (typeof roster === 'string') roster = JSON.parse(roster);

            if (!roster || !Array.isArray(roster)) continue;

            console.log(`Checking registration ${reg.id} for team ${reg.team_id}...`);

            let updated = false;
            for (let member of roster) {
                if (!member.ff_ign) {
                    const userRes = await client.query('SELECT ff_ign FROM users WHERE id = $1', [member.user_id]);
                    if (userRes.rows.length > 0) {
                        member.ff_ign = userRes.rows[0].ff_ign || 'Anonymous Player';
                        updated = true;
                    }
                }
            }

            if (updated) {
                await client.query('UPDATE registrations SET roster_snapshot = $1 WHERE id = $2', [JSON.stringify(roster), reg.id]);
                console.log(`✅ Updated registration ${reg.id}`);
            } else {
                console.log(`ℹ️ No updates needed for registration ${reg.id}`);
            }
        }

        console.log('--- DATA REPAIR COMPLETE ---');
    } catch (err) {
        console.error('❌ Data Repair Failed:', err.message);
    } finally {
        client.release();
        pool.end();
    }
}

fixRegistrations();
