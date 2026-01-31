-- Add sponsorship fields to tournaments table
ALTER TABLE tournaments 
ADD COLUMN sponsor_name VARCHAR(255),
ADD COLUMN sponsor_logo TEXT,
ADD COLUMN sponsor_message TEXT;
