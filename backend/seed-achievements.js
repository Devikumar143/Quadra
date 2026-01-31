const db = require('./src/config/db');

const initialAchievements = [
    {
        title: "FIRST BLOOD",
        description: "Initialize your combat career by participating in your first match.",
        icon_name: "Target",
        category: "combat",
        requirement_type: "matches",
        requirement_value: 1,
        reward_points: 50
    },
    {
        title: "PRECISION SLAYER",
        description: "Reach 100 confirmed kills in sanctioned tournaments.",
        icon_name: "Crosshair",
        category: "combat",
        requirement_type: "kills",
        requirement_value: 100,
        reward_points: 200
    },
    {
        title: "SQUAD VETERAN",
        description: "Complete 50 mission deployments.",
        icon_name: "Shield",
        category: "squad",
        requirement_type: "matches",
        requirement_value: 50,
        reward_points: 500
    },
    {
        title: "ELITE RECRUITER",
        description: "Enlist 5 new operatives using your referral protocol.",
        icon_name: "Users",
        category: "prestige",
        requirement_type: "referrals",
        requirement_value: 5,
        reward_points: 300
    }
];

const seedAchievements = async () => {
    try {
        for (const ach of initialAchievements) {
            await db.query(`
                INSERT INTO achievements (title, description, icon_name, category, requirement_type, requirement_value, reward_points)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT DO NOTHING
            `, [ach.title, ach.description, ach.icon_name, ach.category, ach.requirement_type, ach.requirement_value, ach.reward_points]);
        }
        console.log("Achievements SEEDED: Hall of Valor Updated 🏆");
        process.exit(0);
    } catch (err) {
        console.error("Seeding Error:", err.message);
        process.exit(1);
    }
};

seedAchievements();
