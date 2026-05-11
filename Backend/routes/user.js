import express from "express";
import { getDashboard, getTrends } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/dashboard", getDashboard);
router.get("/trends", getTrends);

export default router;
