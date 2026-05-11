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

export const getAllStations = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.station_name, s.file_name
       FROM stations s
       ORDER BY s.station_name`
    );

    const stations = await Promise.all(
      result.rows.map(async (row) => {
        const aqiResult = await db.query(
          `SELECT recorded_at AS date, pm25, pm10, ozone, no2, so2, co
           FROM aqi_data
           WHERE station_id = $1
           ORDER BY recorded_at DESC LIMIT 100`,
          [row.id]
        );

        const rows = aqiResult.rows;
        let latestAqi = null;

        if (rows.length > 0) {
          const pollutantFields = ['pm25', 'pm10', 'ozone', 'no2', 'so2', 'co'];
          latestAqi = {
            date: rows[0].date,
          };

          pollutantFields.forEach(field => {
            latestAqi[field] = null;
            for (const aqiRow of rows) {
              if (aqiRow[field] != null) {
                // coerce numeric strings to numbers
                latestAqi[field] = typeof aqiRow[field] === 'string' ? Number(aqiRow[field]) : aqiRow[field];
                break;
              }
            }
          });
          if (latestAqi.ozone !== undefined) {
            latestAqi.o3 = latestAqi.ozone;
          }
        }

        return {
          id: row.id,
          stationName: row.station_name,
          fileName: row.file_name,
          latestAqi,
        };
      })
    );

    res.json(stations);
  } catch (error) {
    next(error);
  }
};

export const getStationWithAqi = async (req, res, next) => {
  try {
    const stationId = Number(req.params.stationId);

    const result = await db.query(
      `SELECT s.id, s.station_name, s.file_name
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
      `SELECT recorded_at AS date, pm25, pm10, ozone, no2, so2, co, station_id
       FROM aqi_data
       WHERE station_id = $1
       ORDER BY recorded_at DESC NULLS LAST
       LIMIT 100`,
      [stationId]
    );

    const rows = aqiResult.rows;
    let latestAqi = null;

    if (rows.length > 0) {
      const pollutantFields = ['pm25', 'pm10', 'ozone', 'no2', 'so2', 'co'];
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
      aqiHistory: aqiHistory.rows,
      latestAqi,
    };

    res.json(station);
  } catch (error) {
    next(error);
  }
};
