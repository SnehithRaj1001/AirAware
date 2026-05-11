import db from "../db.js";

export const findAllStations = async () => {
  const result = await db.query(
    "SELECT id, station_name, file_name FROM stations ORDER BY station_name ASC",
  );
  return result.rows;
};

export const findStationById = async (id) => {
  const result = await db.query(
    "SELECT id, station_name, file_name FROM stations WHERE id = $1",
    [id],
  );
  return result.rows[0];
};

export const findLatestPollutionByStation = async (stationId) => {
  const result = await db.query(
    `SELECT a.id, a.recorded_at AS date, a.pm25, a.pm10, a.ozone, a.no2, a.so2, a.co, a.station_id
     FROM aqi_data a
     WHERE a.station_id = $1
     ORDER BY a.recorded_at DESC NULLS LAST
     LIMIT 100`,
    [stationId],
  );

  const rows = result.rows;
  if (rows.length === 0) {
    return null;
  }

  // Create an object with the most recent non-null value for each field
  const pollutantFields = ['pm25', 'pm10', 'ozone', 'no2', 'so2', 'co'];
  const latestPollution = {
    id: rows[0].id,
    station_id: rows[0].station_id,
    date: rows[0].date,
  };

  // For each pollutant, find the most recent non-null value across all rows
  pollutantFields.forEach(field => {
    latestPollution[field] = null;
    for (const row of rows) {
      if (row[field] != null) {
        latestPollution[field] = row[field];
        break;
      }
    }
  });

  return latestPollution;
};

export const findAqiRecordsByStation = async (stationId) => {
  const result = await db.query(
    `SELECT id, recorded_at AS date, pm25, pm10, ozone, no2, so2, co, station_id
     FROM aqi_data
     WHERE station_id = $1
     ORDER BY recorded_at DESC`,
    [stationId],
  );
  return result.rows;
};

export const findAqiHistoryByStation = async (stationId) => {
  const result = await db.query(
    `SELECT id, recorded_at AS date, pm25, pm10, ozone, no2, so2, co
     FROM aqi_data
     WHERE station_id = $1
     ORDER BY recorded_at ASC`,
    [stationId],
  );
  return result.rows;
};

export const findLatestReadingForAllStations = async () => {
  const result = await db.query(
    `SELECT s.id AS station_id,
            s.station_name,
            s.file_name,
            a.date,
            COALESCE(a.pm25, (
              SELECT pm25
              FROM aqi_data
              WHERE station_id = s.id
                AND pm25 IS NOT NULL
              ORDER BY recorded_at DESC
              LIMIT 1
            )) AS pm25,
            COALESCE(a.pm10, (
              SELECT pm10
              FROM aqi_data
              WHERE station_id = s.id
                AND pm10 IS NOT NULL
              ORDER BY recorded_at DESC
              LIMIT 1
            )) AS pm10,
            COALESCE(a.ozone, (
              SELECT ozone
              FROM aqi_data
              WHERE station_id = s.id
                AND ozone IS NOT NULL
              ORDER BY recorded_at DESC
              LIMIT 1
            )) AS ozone,
            COALESCE(a.no2, (
              SELECT no2
              FROM aqi_data
              WHERE station_id = s.id
                AND no2 IS NOT NULL
              ORDER BY recorded_at DESC
              LIMIT 1
            )) AS no2,
            COALESCE(a.so2, (
              SELECT so2
              FROM aqi_data
              WHERE station_id = s.id
                AND so2 IS NOT NULL
              ORDER BY recorded_at DESC
              LIMIT 1
            )) AS so2,
            COALESCE(a.co, (
              SELECT co
              FROM aqi_data
              WHERE station_id = s.id
                AND co IS NOT NULL
              ORDER BY recorded_at DESC
              LIMIT 1
            )) AS co
     FROM stations s
     JOIN LATERAL (
       SELECT pm25, pm10, ozone, no2, so2, co, recorded_at AS date
       FROM aqi_data
       WHERE station_id = s.id
       ORDER BY recorded_at DESC NULLS LAST
       LIMIT 1
     ) a ON true
     ORDER BY s.station_name ASC`,
  );
  return result.rows;
};
