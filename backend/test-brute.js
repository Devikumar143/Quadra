const { Pool } = require('pg');

async function test() {
    const commonPasswords = ['', 'postgres', 'password', 'admin', 'kumar1234'];

    for (const pwd of commonPasswords) {
        console.log(`Trying password: "${pwd}"`);
        const pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'postgres',
            password: pwd,
            port: 5432,
        });

        try {
            const res = await pool.query('SELECT current_database()');
            console.log(`SUCCESS with password: "${pwd}"! Connected to:`, res.rows[0].current_database);

            const dbList = await pool.query('SELECT datname FROM pg_database WHERE datistemplate = false');
            console.log('Available databases:', dbList.rows.map(r => r.datname));

            await pool.end();
            return;
        } catch (err) {
            console.log(`Failed: ${err.message}`);
        } finally {
            await pool.end();
        }
    }
    console.log('All common passwords failed.');
}

test();
