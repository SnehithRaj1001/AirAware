import express from "express";
import { getNews, getAllStations, getStationWithAqi } from "../controllers/publicController.js";

const router = express.Router();

router.get("/news", getNews);
router.get("/map/stations", getAllStations);
router.get("/map/stations/:stationId", getStationWithAqi);

export default router;
