import db from "../db.js";

export const getNews = async (req, res, next) => {
  try {
    // Mock news data - can be replaced with real API later
    const news = [
      {
        id: 1,
        title: "Air Quality Improves in Major Cities",
        description: "Recent air quality improvements observed due to reduced traffic during monsoon season.",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        severity: "positive",
      },
      {
        id: 2,
        title: "Health Advisory: High PM2.5 Levels",
        description: "Health experts recommend staying indoors during high pollution hours.",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        severity: "warning",
      },
      {
        id: 3,
        title: "New Air Quality Monitoring Station Installed",
        description: "Three new monitoring stations have been installed across the city.",
        date: new Date(),
        severity: "info",
      },
      {
        id: 4,
        title: "Pollution Alert: Heavy Traffic Expected",
        description: "Expected increase in pollution levels due to heavy traffic this weekend.",
        date: new Date(),
        severity: "alert",
      },
    ];
    res.json(news);
  } catch (error) {
    next(error);
  }
};

export const getMapConfig = async (req, res, next) => {
  try {
    res.json({
      cartoApiKey: process.env.CARTO_API_KEY || "",
    });
  } catch (error) {
    next(error);
  }
};

export const getAllStations = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT s.id, 
              s.station_name AS "stationName", 
              s.city,
              s.file_name AS "fileName", 
              s.latitude, 
              s.longitude, 
              s.address,
              a.date,
              a.pm25,
              a.pm10,
              a.ozone AS o3,
              a.no2,
              a.so2,
              a.co,
              a.nh3
       FROM stations s
       LEFT JOIN LATERAL (
         SELECT recorded_at AS date, pm25, pm10, ozone, no2, so2, co, nh3
         FROM aqi_data
         WHERE station_id = s.id
         ORDER BY recorded_at DESC NULLS LAST
         LIMIT 1
       ) a ON true
       ORDER BY s.station_name ASC`
    );

    const stations = result.rows.map((row) => ({
      id: row.id,
      stationName: row.stationName,
      city: row.city,
      fileName: row.fileName,
      latitude: row.latitude != null ? Number(row.latitude) : null,
      longitude: row.longitude != null ? Number(row.longitude) : null,
      address: row.address,
      latestAqi: row.date
        ? {
            date: row.date,
            pm25: row.pm25 != null ? Number(row.pm25) : null,
            pm10: row.pm10 != null ? Number(row.pm10) : null,
            o3: row.o3 != null ? Number(row.o3) : null,
            no2: row.no2 != null ? Number(row.no2) : null,
            so2: row.so2 != null ? Number(row.so2) : null,
            co: row.co != null ? Number(row.co) : null,
            nh3: row.nh3 != null ? Number(row.nh3) : null,
          }
        : null,
    }));

    res.json(stations);
  } catch (error) {
    next(error);
  }
};

export const getStationWithAqi = async (req, res, next) => {
  try {
    const stationId = Number(req.params.stationId);

    const result = await db.query(
      `SELECT s.id, s.station_name, s.file_name, s.latitude, s.longitude, s.address
       FROM stations s
       WHERE s.id = $1`,
      [stationId]
    );

    if (result.rows.length === 0) {
      const error = new Error("Station not found");
      error.status = 404;
      throw error;
    }

    const aqiResult = await db.query(
      `SELECT recorded_at AS date, pm25, pm10, ozone, no2, so2, co, nh3, station_id
       FROM aqi_data
       WHERE station_id = $1
       ORDER BY recorded_at DESC NULLS LAST
       LIMIT 100`,
      [stationId]
    );

    const rows = aqiResult.rows;
    let latestAqi = null;

    if (rows.length > 0) {
      const pollutantFields = ['pm25', 'pm10', 'ozone', 'no2', 'so2', 'co', 'nh3'];
      latestAqi = { date: rows[0].date };

      pollutantFields.forEach(field => {
        latestAqi[field] = null;
        for (const aqiRow of rows) {
          if (aqiRow[field] != null) {
            latestAqi[field] = typeof aqiRow[field] === 'string' ? Number(aqiRow[field]) : aqiRow[field];
            break;
          }
        }
      });
      if (latestAqi.ozone !== undefined) {
        latestAqi.o3 = latestAqi.ozone;
      }
    }

    const aqiHistory = await db.query(
      `SELECT recorded_at AS date, pm25, pm10, ozone, no2, so2, co
       FROM aqi_data
       WHERE station_id = $1
       ORDER BY recorded_at ASC`,
      [stationId]
    );

    const station = {
      id: result.rows[0].id,
      stationName: result.rows[0].station_name,
      fileName: result.rows[0].file_name,
      latitude: result.rows[0].latitude != null ? Number(result.rows[0].latitude) : null,
      longitude: result.rows[0].longitude != null ? Number(result.rows[0].longitude) : null,
      address: result.rows[0].address,
      aqiHistory: aqiHistory.rows,
      latestAqi,
    };

    res.json(station);
  } catch (error) {
    next(error);
  }
};
