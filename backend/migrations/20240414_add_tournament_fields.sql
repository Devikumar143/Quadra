-- Migration to add prize_pool, prestige_points, map_name, and other fields to tournaments table

-- 1. Check and add prize_pool if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='prize_pool') THEN
        ALTER TABLE tournaments ADD COLUMN prize_pool VARCHAR(50) DEFAULT '₹5,000';
    END IF;
END $$;

-- 2. Check and add prestige_points if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='prestige_points') THEN
        ALTER TABLE tournaments ADD COLUMN prestige_points INTEGER DEFAULT 500;
    END IF;
END $$;

-- 3. Check and add map_name if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='map_name') THEN
        ALTER TABLE tournaments ADD COLUMN map_name VARCHAR(100) DEFAULT 'Bermuda';
    END IF;
END $$;

-- 4. Check and add max_teams if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='max_teams') THEN
        ALTER TABLE tournaments ADD COLUMN max_teams INTEGER DEFAULT 12;
    END IF;
END $$;

-- 5. Check and add end_date if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='end_date') THEN
        ALTER TABLE tournaments ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
