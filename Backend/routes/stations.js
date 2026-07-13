import express from "express";
import {
  getAllStations,
  getStationById,
  getStationForecast,
  getStationForecastStream,
} from "../controllers/stationController.js";

const router = express.Router();

router.get("/", getAllStations);
router.get("/:id", getStationById);
router.get("/:id/forecast", getStationForecast);
router.get("/:id/forecast/stream", getStationForecastStream);

export default router;
