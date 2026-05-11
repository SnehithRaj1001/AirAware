import express from "express";
import {
  getAllStations,
  getStationById,
} from "../controllers/stationController.js";

const router = express.Router();

router.get("/", getAllStations);
router.get("/:id", getStationById);

export default router;
