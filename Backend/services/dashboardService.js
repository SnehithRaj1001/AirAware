import {
  findOverallPm25Summary,
  findLatestPm25ByStation,
} from "../repositories/aqiRepository.js";

export const getDashboardSummaryData = async () => {
  const [summary, stationPm25] = await Promise.all([
    findOverallPm25Summary(),
    findLatestPm25ByStation(),
  ]);

  const averagePm25 = Number(summary.average_pm25 ?? 0).toFixed(2);

  const sortedStations = stationPm25.filter((row) => row.pm25 != null);
  sortedStations.sort((a, b) => b.pm25 - a.pm25);

  const highest = sortedStations[0];
  const lowest = sortedStations[sortedStations.length - 1];

  return {
    average_pm25: Number(averagePm25),
    highest_pm25_station: highest
      ? {
          station_id: highest.station_id,
          station_name: highest.station_name,
          pm25: highest.pm25,
          date: highest.date,
        }
      : null,
    lowest_pm25_station: lowest
      ? {
          station_id: lowest.station_id,
          station_name: lowest.station_name,
          pm25: lowest.pm25,
          date: lowest.date,
        }
      : null,
  };
};
