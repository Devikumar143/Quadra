const { Pool } = require('pg');

async function test() {
    const passwords = ['onedraw', 'onedraw123', 'Onedraw123', 'kumar123'];

    for (const pwd of passwords) {
        process.stdout.write(`Testing "${pwd}"... `);
        const pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'postgres',
            password: pwd,
            port: 5432,
            connectionTimeoutMillis: 2000,
        });

        try {
            await pool.query('SELECT 1');
            console.log('SUCCESS!');
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
