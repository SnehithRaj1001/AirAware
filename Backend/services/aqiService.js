import {
  findLatestAqiByStation,
  findAqiHistory,
  findAllAqiRecords,
  findTrendsByStation,
  findMultiStationTrends,
  findCityTrends,
} from "../repositories/aqiRepository.js";
import { findStationById } from "../repositories/stationRepository.js";

export const getLatestAqi = async (stationId) => {
  const station = await findStationById(stationId);
  if (!station) {
    const error = new Error("Station not found");
    error.status = 404;
    throw error;
  }

  const latest = await findLatestAqiByStation(stationId);
  if (!latest) {
    const error = new Error("No AQI data available for this station");
    error.status = 404;
    throw error;
  }

  return {
    station,
    latest,
  };
};

export const getAqiHistoryForStation = async (stationId) => {
  const station = await findStationById(stationId);
  if (!station) {
    const error = new Error("Station not found");
    error.status = 404;
    throw error;
  }

  const history = await findAqiHistory(stationId);
  return { station, history };
};

export const getAqiRecordsForStation = async (stationId) => {
  const station = await findStationById(stationId);
  if (!station) {
    const error = new Error("Station not found");
    error.status = 404;
    throw error;
  }
  const records = await findAllAqiRecords(stationId);
  return { station, records };
};

export const getTrendsForStation = async (stationId) => {
  const station = await findStationById(stationId);
  if (!station) {
    const error = new Error("Station not found");
    error.status = 404;
    throw error;
  }

  const trends = await findTrendsByStation(stationId);
  return { station, trends };
};

export const getMultiStationComparison = async (stationIds, days = 30) => {
  if (!Array.isArray(stationIds) || stationIds.length === 0) {
    const error = new Error("At least one station ID is required");
    error.status = 400;
    throw error;
  }
  const trends = await findMultiStationTrends(stationIds, days);
  return { stationIds, days, count: trends.length, trends };
};

export const getCityComparison = async (cities, days = 30) => {
  if (!Array.isArray(cities) || cities.length === 0) {
    const error = new Error("At least one city is required");
    error.status = 400;
    throw error;
  }
  const trends = await findCityTrends(cities, days);
  return { cities, days, count: trends.length, trends };
};

