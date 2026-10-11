import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import db from "../db.js";
import { findUserById } from "../repositories/userRepository.js";
import { calculateHealthAdvisory, calculateMultiDayHealthAdvisory } from "./healthAdvisoryService.js";
import { ForecastService } from "./forecastService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getUserDashboardData = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  // Find station by user's location
  const stationResult = await db.query(
    "SELECT id, station_name, file_name, latitude, longitude, address FROM stations WHERE LOWER(station_name) LIKE LOWER($1) LIMIT 1",
    [`%${user.location}%`]
  );

  let station = null;
  if (stationResult.rows.length > 0) {
    const s = stationResult.rows[0];
    station = {
      ...s,
      latitude: s.latitude != null ? Number(s.latitude) : null,
      longitude: s.longitude != null ? Number(s.longitude) : null,
    };
  }

  // Get latest AQI data with fallback to previous non-null values
  let aqiResult = { rows: [] };
  if (station) {
    aqiResult = await db.query(
      `SELECT id, recorded_at AS date, pm25, pm10, ozone, no2, so2, co, nh3, station_id
       FROM aqi_data
       WHERE station_id = $1
       ORDER BY recorded_at DESC NULLS LAST
       LIMIT 100`,
      [station.id]
    );
  }

  const rows = aqiResult.rows;
  let latestAqi = null;

  if (rows.length > 0) {
    // Create an object with the most recent non-null value for each field
    const pollutantFields = ['pm25', 'pm10', 'ozone', 'no2', 'so2', 'co', 'nh3'];
    latestAqi = {
      id: rows[0].id,
      station_id: rows[0].station_id,
      date: rows[0].date,
    };

    // For each pollutant, find the most recent non-null value across all rows
    pollutantFields.forEach(field => {
      latestAqi[field] = null;
      for (const row of rows) {
        if (row[field] != null) {
          latestAqi[field] = typeof row[field] === 'string' ? Number(row[field]) : row[field];
          break;
        }
      }
    });
    if (latestAqi.ozone !== undefined) {
      latestAqi.o3 = latestAqi.ozone;
    }
    // Calculate composite AQI for station
    latestAqi.aqi = Math.max(
      ...pollutantFields.map(f => Number(latestAqi[f]) || 0)
    );
  }

  // Compute Personalized Health Advisory based on user health parameters & station predicted/latest AQI
  const effectiveAqi = latestAqi?.aqi || latestAqi?.pm25 || 60;
  
  // Multi-day forecast integration if model exists
  let forecastList = [];
  if (station?.id) {
    try {
      const modelPath = path.join(__dirname, '../../models', `station_${station.id}.pkl`);
      if (fs.existsSync(modelPath)) {
        forecastList = await ForecastService.getForecast(station.id);
      }
    } catch (e) {
      // Model not yet trained or forecast generation skipped
    }
  }

  const multiDay = await calculateMultiDayHealthAdvisory({
    user,
    stationId: station?.id || null,
    currentAqi: effectiveAqi,
    forecastList: Array.isArray(forecastList) ? forecastList : [],
    stationName: station?.station_name || user.location || "Nearby Station",
  });

  return {
    user: {
      firstName: user.first_name,
      lastName: user.last_name,
      location: user.location,
      age: user.age,
      healthConditions: user.health_conditions || [],
      smokingStatus: user.smoking_status,
      activityLevel: user.activity_level,
      symptomSensitivity: user.symptom_sensitivity,
    },
    station,
    latestAqi,
    healthAdvisory: multiDay.today,
    advisoryTimeline: multiDay.timeline,
    aiInsights: multiDay.aiInsights,
  };
};

export const getUserHealthAdvisory = async (userId, customStationId = null) => {
  const user = await findUserById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  let station = null;
  if (customStationId) {
    const stRes = await db.query(
      "SELECT id, station_name, latitude, longitude, address FROM stations WHERE id = $1 LIMIT 1",
      [customStationId]
    );
    if (stRes.rows.length > 0) station = stRes.rows[0];
  }

  if (!station && user.location) {
    const stRes = await db.query(
      "SELECT id, station_name, latitude, longitude, address FROM stations WHERE LOWER(station_name) LIKE LOWER($1) LIMIT 1",
      [`%${user.location}%`]
    );
    if (stRes.rows.length > 0) station = stRes.rows[0];
  }

  // Fallback to first station if no match
  if (!station) {
    const stRes = await db.query("SELECT id, station_name, latitude, longitude, address FROM stations ORDER BY id ASC LIMIT 1");
    if (stRes.rows.length > 0) station = stRes.rows[0];
  }

  // Fetch recent telemetry for the chosen station
  let stationAqi = 65;
  if (station) {
    const aqiRes = await db.query(
      `SELECT pm25, pm10, ozone, no2, so2, co, nh3 FROM aqi_data WHERE station_id = $1 ORDER BY recorded_at DESC NULLS LAST LIMIT 1`,
      [station.id]
    );
    if (aqiRes.rows.length > 0) {
      const row = aqiRes.rows[0];
      const maxVal = Math.max(
        Number(row.pm25) || 0,
        Number(row.pm10) || 0,
        Number(row.no2) || 0,
        Number(row.ozone) || 0,
        Number(row.nh3) || 0
      );
      if (maxVal > 0) stationAqi = maxVal;
    }
  }

  // Try fetching multi-day forecast if model exists for this station
  let forecastList = [];
  try {
    const modelPath = path.join(__dirname, '../../models', `station_${station.id}.pkl`);
    if (fs.existsSync(modelPath)) {
      forecastList = await ForecastService.getForecast(station.id);
    }
  } catch (err) {
    console.warn(`[UserHealthAdvisory] Forecast load skipped for station ${station.id}:`, err.message);
  }

  const multiDayAdvisory = await calculateMultiDayHealthAdvisory({
    user,
    stationId: station?.id || null,
    currentAqi: stationAqi,
    forecastList: Array.isArray(forecastList) ? forecastList : [],
    stationName: station?.station_name || "Assigned Station",
  });

  return {
    station,
    user: {
      firstName: user.first_name,
      lastName: user.last_name,
      location: user.location,
      age: user.age,
      healthConditions: user.health_conditions || [],
      smokingStatus: user.smoking_status,
      activityLevel: user.activity_level,
      symptomSensitivity: user.symptom_sensitivity,
    },
    advisory: multiDayAdvisory.today,
    timeline: multiDayAdvisory.timeline,
    aiInsights: multiDayAdvisory.aiInsights,
  };
};


export const getUserTrends = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  // Find station by user's location
  const stationResult = await db.query(
    "SELECT id, station_name FROM stations WHERE LOWER(station_name) LIKE LOWER($1) LIMIT 1",
    [`%${user.location}%`]
  );

  if (stationResult.rows.length === 0) {
    return { station: null, data: [] };
  }

  const station = stationResult.rows[0];

  // Get historical AQI data (last 30 days)
  const trendsResult = await db.query(
    `SELECT recorded_at AS date, pm25, pm10, ozone, no2, so2, co
     FROM aqi_data
     WHERE station_id = $1
     AND recorded_at >= CURRENT_DATE - INTERVAL '30 days'
     ORDER BY recorded_at ASC`,
    [station.id]
  );

  return {
    station,
    data: trendsResult.rows,
  };
};
