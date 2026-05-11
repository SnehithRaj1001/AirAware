import express from "express";
import {
  getLatestAqiForStation,
  getAqiHistory,
  getAqiRecords,
  getAqiTrends,
} from "../controllers/aqiController.js";

const router = express.Router();

router.get("/history/:stationId", getAqiHistory);
router.get("/station/:stationId", getAqiRecords);
router.get("/trends/:stationId", getAqiTrends);
router.get("/:stationId", getLatestAqiForStation);

export default router;
