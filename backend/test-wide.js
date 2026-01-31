const { Pool } = require('pg');

async function test() {
    const passwords = ['postgres', 'password', 'admin', 'kumar1234', 'Kumar1234', 'JEDEVIKUMAR', 'Jedevikumar', 'root', '12345678', ''];

    for (const pwd of passwords) {
        process.stdout.write(`Testing "${pwd}"... `);
        const pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'postgres', // Connect to default first
            password: pwd,
            port: 5432,
            connectionTimeoutMillis: 2000,
        });

        try {
            await pool.query('SELECT 1');
            console.log('SUCCESS!');
            const dbs = await pool.query('SELECT datname FROM pg_database WHERE datistemplate = false');
            console.log('Databases:', dbs.rows.map(r => r.datname));
            await pool.end();
            return;
        } catch (err) {
            console.log(`Failed (${err.message})`);
        } finally {
            await pool.end();
        }
    }
}

test();
