const db = require('./src/config/db');

async function setupAnnouncements() {
    try {
        console.log('Creating announcements table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                content TEXT NOT NULL,
                priority INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if announcements already exist
        const check = await db.query("SELECT COUNT(*) FROM announcements");
        if (parseInt(check.rows[0].count) === 0) {
            console.log('Seeding initial announcements...');
            await db.query(`
                INSERT INTO announcements (content, priority) VALUES 
                ('ELITE TOURNAMENT REGISTRATION CLOSING IN 2 HOURS', 1),
                ('GLOBAL LEADERBOARD RESET IN 3 DAYS', 0),
                ('NEW "OBSIDIAN GOLD" AVATARS NOW AVAILABLE', 0),
                ('WELCOME TO QUADRA ARENA - SEASON 4 ACTIVE', 0)
            `);
        }

        console.log('Announcements system initialized ✅');
        process.exit(0);
    } catch (err) {
        console.error('Initialization failed ❌');
        console.error(err.message);
        process.exit(1);
    }
}

setupAnnouncements();
