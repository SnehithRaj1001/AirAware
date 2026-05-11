import {
  getStations,
  getStation,
  getStationsWithLatestAqi,
} from "../services/stationService.js";

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
