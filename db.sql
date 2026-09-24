------------ CREATE 'stations' TABLE ------------
CREATE TABLE stations (
    id SERIAL PRIMARY KEY,
    city VARCHAR(100),
    station_name VARCHAR(255) UNIQUE,
    file_name VARCHAR(255) UNIQUE,
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    address TEXT
);

------------ CREATE 'aqi_data' TABLE ------------
CREATE TABLE aqi_data (
    id SERIAL PRIMARY KEY,

    station_id INTEGER NOT NULL REFERENCES stations(id)
    ON DELETE CASCADE,

    station_name VARCHAR(255) NOT NULL,

    recorded_at TIMESTAMP NOT NULL,

    -- Main AQI Parameters
    pm25 DECIMAL(10,2),
    pm10 DECIMAL(10,2),
    no2 DECIMAL(10,2),
    nh3 DECIMAL(10,2),
    so2 DECIMAL(10,2),
    co DECIMAL(10,2),
    ozone DECIMAL(10,2),

    -- PM2.5 Features
    pm25_lag1 DECIMAL(10,2),
    pm25_lag7 DECIMAL(10,2),
    pm25_lag14 DECIMAL(10,2),
    pm25_7day_ma DECIMAL(10,2),

    -- PM10 Features
    pm10_lag1 DECIMAL(10,2),
    pm10_lag7 DECIMAL(10,2),
    pm10_lag14 DECIMAL(10,2),
    pm10_7day_ma DECIMAL(10,2),

    -- NO2 Features
    no2_lag1 DECIMAL(10,2),
    no2_lag7 DECIMAL(10,2),
    no2_lag14 DECIMAL(10,2),
    no2_7day_ma DECIMAL(10,2),

    -- NH3 Features
    nh3_lag1 DECIMAL(10,2),
    nh3_lag7 DECIMAL(10,2),
    nh3_lag14 DECIMAL(10,2),
    nh3_7day_ma DECIMAL(10,2),

    -- SO2 Features
    so2_lag1 DECIMAL(10,2),
    so2_lag7 DECIMAL(10,2),
    so2_lag14 DECIMAL(10,2),
    so2_7day_ma DECIMAL(10,2),

    -- CO Features
    co_lag1 DECIMAL(10,2),
    co_lag7 DECIMAL(10,2),
    co_lag14 DECIMAL(10,2),
    co_7day_ma DECIMAL(10,2),

    -- Ozone Features
    ozone_lag1 DECIMAL(10,2),
    ozone_lag7 DECIMAL(10,2),
    ozone_lag14 DECIMAL(10,2),
    ozone_7day_ma DECIMAL(10,2),

    -- Additional Features
    month INTEGER,
    day_of_week VARCHAR(20),
    is_weekend BOOLEAN,

    -- Prevent duplicate data
    CONSTRAINT unique_station_datetime
    UNIQUE(station_id, recorded_at)
);


------------ CREATE 'users' TABLE ------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,

    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,

    username VARCHAR(50) UNIQUE NOT NULL,

    email VARCHAR(100) UNIQUE NOT NULL,

    password TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    location VARCHAR(100),
    age INTEGER,
    gender VARCHAR(50),
    health_conditions TEXT[],
    smoking_status VARCHAR(50),
    activity_level VARCHAR(50),
    symptom_sensitivity VARCHAR(50),
    notes TEXT
);

------------ CREATE 'user_symptom_logs' TABLE ------------
CREATE TABLE IF NOT EXISTS user_symptom_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medication_taken BOOLEAN DEFAULT FALSE,
    symptoms_logged TEXT[],
    symptom_severity VARCHAR(50),
    outdoor_time_hours DECIMAL(4, 1),
    notes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);