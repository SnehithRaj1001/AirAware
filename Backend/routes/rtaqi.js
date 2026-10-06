import express from "express";
import { getLatestIotData, getIotHistory } from "../controllers/rtaqiController.js";

const router = express.Router();

// GET /api/rtaqi/latest or /rtaqi/latest
router.get("/latest", getLatestIotData);

// GET /api/rtaqi/history or /rtaqi/history
router.get("/history", getIotHistory);

export default router;
