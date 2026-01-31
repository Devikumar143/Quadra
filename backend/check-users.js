const db = require('./src/config/db');

const fs = require('fs');

async function debug() {
    try {
        let output = '';
        const log = (msg) => { output += msg + '\n'; };
        const logTable = (title, rows) => {
            log(`\n--- ${title} ---`);
            log(JSON.stringify(rows, null, 2));
        };

        const users = await db.query('SELECT id, ff_ign, email, role FROM users');
        logTable('USERS', users.rows);

        const teams = await db.query('SELECT id, name, leader_id FROM teams');
        logTable('TEAMS', teams.rows);

        const regs = await db.query('SELECT r.id, r.tournament_id, r.team_id, r.status, t.name as team_name FROM registrations r JOIN teams t ON r.team_id = t.id');
        logTable('REGISTRATIONS', regs.rows);

        const members = await db.query('SELECT tm.team_id, tm.user_id, tm.role, u.ff_ign FROM team_members tm JOIN users u ON tm.user_id = u.id');
        logTable('TEAM MEMBERS', members.rows);

        fs.writeFileSync('debug_output.txt', output);
        console.log('Debug info written to debug_output.txt');

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debug();
