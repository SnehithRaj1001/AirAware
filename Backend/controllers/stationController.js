import {
  getStations,
  getStation,
  getStationsWithLatestAqi,
} from "../services/stationService.js";
import { ForecastService } from "../services/forecastService.js";

export const getAllStations = async (req, res, next) => {
  try {
    const stations = await getStationsWithLatestAqi();
    res.json({ stations });
  } catch (error) {
    next(error);
  }
};

export const getStationById = async (req, res, next) => {
  try {
    const station = await getStation(Number(req.params.id));
    res.json({ station });
  } catch (error) {
    next(error);
  }
};

export const getStationForecast = async (req, res, next) => {
  try {
    const stationId = Number(req.params.id);
    console.log(`[ForecastRequest] Station ID: ${stationId}`);
    const forecast = await ForecastService.getForecast(stationId);
    res.json({ forecast });
  } catch (error) {
    console.error(`[ForecastError] Station ID: ${Number(req.params.id)}`, error);
    next(error);
  }
};

export const getStationForecastStream = async (req, res, next) => {
  try {
    const stationId = Number(req.params.id);
    console.log(`[ForecastStreamRequest] Station ID: ${stationId}`);
    await ForecastService.getForecastStream(stationId, res);
  } catch (error) {
    console.error(`[ForecastStreamError] Station ID: ${Number(req.params.id)}`, error);
    if (!res.headersSent) {
      next(error);
    } else {
      res.write(`data: ${JSON.stringify({ status: 'error', message: error.message })}\n\n`);
      res.end();
    }
  }
};
