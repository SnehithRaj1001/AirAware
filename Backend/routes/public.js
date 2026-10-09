import express from "express";
import { getNews, getAllStations, getStationWithAqi, getMapConfig } from "../controllers/publicController.js";

const router = express.Router();

router.get("/news", getNews);
router.get("/map/config", getMapConfig);
router.get("/map/stations", getAllStations);
router.get("/map/stations/:stationId", getStationWithAqi);

export default router;

