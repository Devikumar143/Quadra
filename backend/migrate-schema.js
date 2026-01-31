const db = require('./src/config/db');

const migrate = async () => {
    try {
        console.log("Starting Phase 2/3 Schema Migration...");

        // 1. Add missing user fields
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS bio TEXT,
            ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS avatar_id INT DEFAULT 1,
            ADD COLUMN IF NOT EXISTS prestige_points INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE,
            ADD COLUMN IF NOT EXISTS combat_role VARCHAR(50);
        `);

        // 2. Create Achievements table
        await db.query(`
            CREATE TABLE IF NOT EXISTS achievements (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                icon_name VARCHAR(50) NOT NULL,
                category VARCHAR(50) DEFAULT 'combat',
                requirement_type VARCHAR(50) NOT NULL,
                requirement_value INT NOT NULL,
                reward_points INT DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Create User Achievements table
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_achievements (
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
                unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, achievement_id)
            );
        `);

        // 4. Create Recruitment table
        await db.query(`
            CREATE TABLE IF NOT EXISTS recruitment_posts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                team_id UUID REFERENCES teams(id) ON DELETE CASCADE, -- NULL if LFS
                type VARCHAR(10) NOT NULL, -- 'LFS' (Looking for Squad) or 'LFM' (Looking for Member)
                description TEXT NOT NULL,
                combat_role_pref VARCHAR(50), -- Preferred role
                status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed'
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Migration SUCCESS: Database Synchronized 🛡️");
        process.exit(0);
    } catch (err) {
        console.error("Migration FAILURE:", err.message);
        process.exit(1);
    }
};

migrate();
