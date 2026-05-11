import {
  getLatestAqi,
  getAqiHistoryForStation,
  getAqiRecordsForStation,
  getTrendsForStation,
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
