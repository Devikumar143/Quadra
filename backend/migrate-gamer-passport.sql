-- Migration: Add Gamer Passport and Prestige features to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS prestige_points INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;

-- Create an index for referral codes
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
