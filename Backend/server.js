import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from Backend/.env and root .env
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
import cors from "cors";
import stationRoutes from "./routes/stations.js";
import aqiRoutes from "./routes/aqi.js";
import dashboardRoutes from "./routes/dashboard.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import publicRoutes from "./routes/public.js";
import rtaqiRoutes from "./routes/rtaqi.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/api", publicRoutes);
app.use("/api/rtaqi", rtaqiRoutes);
app.use("/rtaqi", rtaqiRoutes);
app.use("/stations", stationRoutes);
app.use("/aqi", aqiRoutes);
app.use("/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({ message: "AirAware API is running", version: "1.0.0" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`AirAware backend running on http://localhost:${PORT}`);
});
