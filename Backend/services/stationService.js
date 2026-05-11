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
    latest: {
      date: row.date,
      pm25: row.pm25 == null ? null : Number(row.pm25),
      pm10: row.pm10 == null ? null : Number(row.pm10),
      ozone: row.ozone == null ? null : Number(row.ozone),
      o3: row.ozone == null ? null : Number(row.ozone),
      no2: row.no2 == null ? null : Number(row.no2),
      so2: row.so2 == null ? null : Number(row.so2),
      co: row.co == null ? null : Number(row.co),
    },
  }));
};
