-- Add file_name column to stations table
ALTER TABLE stations ADD COLUMN file_name VARCHAR(255);

-- Optional: Create index for faster lookups
CREATE INDEX idx_stations_file_name ON stations(file_name);