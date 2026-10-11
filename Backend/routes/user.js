import express from "express";
import { getDashboard, getTrends, getHealthAdvisory } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/dashboard", getDashboard);
router.get("/advisory", getHealthAdvisory);
router.get("/trends", getTrends);

export default router;

