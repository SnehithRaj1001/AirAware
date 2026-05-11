import "dotenv/config";
import express from "express";
import cors from "cors";
import stationRoutes from "./routes/stations.js";
import aqiRoutes from "./routes/aqi.js";
import dashboardRoutes from "./routes/dashboard.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import publicRoutes from "./routes/public.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/api", publicRoutes);
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
