import {
  findAllStations,
  findStationById,
  findLatestReadingForAllStations,
} from "../repositories/stationRepository.js";

export const getStations = async () => {
  const stations = await findAllStations();
  return stations;
};

export const getStation = async (id) => {
  const station = await findStationById(id);
  if (!station) {
    const error = new Error("Station not found");
    error.status = 404;
    throw error;
  }
  return station;
};

export const getStationsWithLatestAqi = async () => {
  const stations = await findLatestReadingForAllStations();
  return stations.map((row) => ({
    station_id: row.station_id,
    station_name: row.station_name,
    file_name: row.file_name,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    latest: {
      date: row.date,
      pm25: row.pm25 == null ? null : Number(row.pm25),
      pm10: row.pm10 == null ? null : Number(row.pm10),
      ozone: row.ozone == null ? null : Number(row.ozone),
      o3: row.ozone == null ? null : Number(row.ozone),
      no2: row.no2 == null ? null : Number(row.no2),
      so2: row.so2 == null ? null : Number(row.so2),
      co: row.co == null ? null : Number(row.co),
      nh3: row.nh3 == null ? null : Number(row.nh3),
      aqi: Math.max(
        ...['pm25', 'pm10', 'ozone', 'no2', 'so2', 'co', 'nh3']
          .map(p => Number(row[p]) || 0)
      )
    },
  }));
};
