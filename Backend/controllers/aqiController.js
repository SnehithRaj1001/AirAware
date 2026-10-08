import {
  getLatestAqi,
  getAqiHistoryForStation,
  getAqiRecordsForStation,
  getTrendsForStation,
  getMultiStationComparison,
  getCityComparison,
} from "../services/aqiService.js";

export const getLatestAqiForStation = async (req, res, next) => {
  try {
    const stationId = Number(req.params.stationId);
    const payload = await getLatestAqi(stationId);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

export const getAqiHistory = async (req, res, next) => {
  try {
    const stationId = Number(req.params.stationId);
    const payload = await getAqiHistoryForStation(stationId);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

export const getAqiRecords = async (req, res, next) => {
  try {
    const stationId = Number(req.params.stationId);
    const payload = await getAqiRecordsForStation(stationId);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

export const getAqiTrends = async (req, res, next) => {
  try {
    const stationId = Number(req.params.stationId);
    const payload = await getTrendsForStation(stationId);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

export const compareStations = async (req, res, next) => {
  try {
    const idsParam = req.query.ids || "";
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    const stationIds = idsParam
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);

    const payload = await getMultiStationComparison(stationIds, days);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

export const compareCities = async (req, res, next) => {
  try {
    const citiesParam = req.query.cities || "";
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    const cities = citiesParam
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const payload = await getCityComparison(cities, days);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

