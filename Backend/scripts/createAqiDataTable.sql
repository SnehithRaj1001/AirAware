-- Create aqi_data table
CREATE TABLE aqi_data (
    id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL REFERENCES stations(id),
    date TIMESTAMP NOT NULL,
    pm25 DECIMAL(10,2),
    pm10 DECIMAL(10,2),
    o3 DECIMAL(10,2),
    no2 DECIMAL(10,2),
    so2 DECIMAL(10,2),
    co DECIMAL(10,2),
    UNIQUE(station_id, date)
);

-- Create indexes for better performance
CREATE INDEX idx_aqi_data_station_id ON aqi_data(station_id);
CREATE INDEX idx_aqi_data_date ON aqi_data(date);