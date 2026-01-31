-- Announcements Table for Live Feed Ticker
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    priority INT DEFAULT 0, -- 0: normal, 1: high (red dot)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed with initial data
INSERT INTO announcements (content, priority) VALUES 
('ELITE TOURNAMENT REGISTRATION CLOSING IN 2 HOURS', 1),
('GLOBAL LEADERBOARD RESET IN 3 DAYS', 0),
('NEW "OBSIDIAN GOLD" AVATARS NOW AVAILABLE', 0),
('WELCOME TO QUADRA ARENA - SEASON 4 ACTIVE', 0);
