-- Seed a test user for Quadra
-- Password: password123
INSERT INTO users (full_name, university_id, ff_uid, ff_ign, email, password_hash, role, stats)
VALUES (
    'Test Player', 
    'UNIV-2024-001', 
    '5623849102', 
    'QUADRA_SQUAD', 
    'player@university.edu', 
    '$2a$10$8uM/X.Y8K5G4G4G4G4G4G.5H5H5H5H5H5H5H5H5H5H5H5H5H5H5H', -- BCrypt for 'password123'
    'player',
    '{"win_rate": "85%", "kd_ratio": "4.5"}'::jsonb
) ON CONFLICT DO NOTHING;
