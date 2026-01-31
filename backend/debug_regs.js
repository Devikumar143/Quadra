const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:kumar1234%40@localhost:5432/quadra' });

async function checkRegistrations() {
    try {
        console.log("Checking registrations...");
        const res = await pool.query("SELECT * FROM registrations");
        console.log("Total Registrations:", res.rowCount);
        console.log("Data:", JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

checkRegistrations();
