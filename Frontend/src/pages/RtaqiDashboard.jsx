import React, { useEffect, useState, useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { rtaqiAPI } from "../api.js";
import "./RtaqiDashboard.css";

// Breakpoint and helper functions for AQI rating based on Indian / US EPA standards
const calculateOverallAqi = (reading) => {
  if (!reading) return null;
  // If reading has gas or PM values, we evaluate sub-indices
  const pm25 = Number(reading.pm25) || 0;
  const pm10 = Number(reading.pm10) || 0;
  const no2 = Number(reading.no2_ppm) || 0;
  const so2 = Number(reading.so2_ppm) || 0;
  const co = Number(reading.co_ppm) || 0;
  const o3 = Number(reading.o3_ppm) || 0;

  // Approximate Indian AQI standard breakpoints
  const calcSubAqi = (val, breaks) => {
    for (const b of breaks) {
      if (val <= b.cHigh) {
        return Math.round(
          ((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (val - b.cLow) + b.iLow
        );
      }
    }
    return 500;
  };

  const pm25Breaks = [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 },
  ];

  const subPm25 = pm25 > 0 ? calcSubAqi(pm25, pm25Breaks) : 0;
  const subPm10 = pm10 > 0 ? Math.round(pm10 * 0.8) : 0;
  
  const estimated = Math.max(subPm25, subPm10, 15);
  return Math.min(estimated, 500);
};

const getAqiCategory = (aqi) => {
  if (aqi === null || aqi === undefined) {
    return { label: "Unknown", color: "#64748b", bg: "rgba(100,116,139,0.1)", desc: "Awaiting data" };
  }
  if (aqi <= 50) return { label: "Good", color: "#10b981", bg: "rgba(16,185,129,0.12)", desc: "Minimal impact on health" };
  if (aqi <= 100) return { label: "Satisfactory", color: "#84cc16", bg: "rgba(132,204,22,0.12)", desc: "Minor breathing discomfort to sensitive people" };
  if (aqi <= 200) return { label: "Moderate", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", desc: "Breathing discomfort to people with lungs/asthma/heart" };
  if (aqi <= 300) return { label: "Poor", color: "#f97316", bg: "rgba(249,115,22,0.12)", desc: "Breathing discomfort to most people on prolonged exposure" };
  if (aqi <= 400) return { label: "Very Poor", color: "#ef4444", bg: "rgba(239,68,68,0.12)", desc: "Respiratory illness on prolonged exposure" };
  return { label: "Severe", color: "#7f1d1d", bg: "rgba(127,29,29,0.2)", desc: "Affects healthy people and seriously impacts those with diseases" };
};

export default function RtaqiDashboard() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const pollTimerRef = useRef(null);

  const fetchData = async () => {
    try {
      const [latestRes, historyRes] = await Promise.all([
        rtaqiAPI.getLatest(),
        rtaqiAPI.getHistory(null, 40),
      ]);

      if (latestRes.data?.data) {
        setLatest(latestRes.data.data);
      }
      if (historyRes.data?.data) {
        // Format history for recharts
        const formatted = historyRes.data.data.map((row) => {
          const time = row.recorded_at
            ? new Date(row.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            : "--";
          return {
            time,
            pm25: row.pm25 != null ? Number(Number(row.pm25).toFixed(2)) : 0,
            pm10: row.pm10 != null ? Number(Number(row.pm10).toFixed(2)) : 0,
            co: row.co_ppm != null ? Number(Number(row.co_ppm).toFixed(3)) : 0,
            no2: row.no2_ppm != null ? Number(Number(row.no2_ppm).toFixed(3)) : 0,
            nh3: row.nh3_ppm != null ? Number(Number(row.nh3_ppm).toFixed(3)) : 0,
            o3: row.o3_ppm != null ? Number(Number(row.o3_ppm).toFixed(4)) : 0,
            so2: row.so2_ppm != null ? Number(Number(row.so2_ppm).toFixed(3)) : 0,
          };
        });
        setHistory(formatted);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      console.error("Failed to load RTAQI data:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch real-time readings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      pollTimerRef.current = setInterval(fetchData, 3000);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [autoRefresh]);

  const aqiValue = calculateOverallAqi(latest);
  const aqiCat = getAqiCategory(aqiValue);

  return (
    <div className="rtaqi-container">
      {/* Top Banner */}
      <div className="rtaqi-header">
        <div className="rtaqi-title-area">
          <div className="rtaqi-badge">
            <span className="live-dot-pulse"></span>
            LIVE RASPBERRY PI IOT STREAM
          </div>
          <h1>Real-Time Air Quality Index (RTAQI)</h1>
          <p className="rtaqi-subtitle">
            Direct real-time hardware telemetry streaming from ADS1115 ADCs, PMS5003 laser sensor, and GPS.
          </p>
        </div>

        <div className="rtaqi-controls">
          <div className="device-info-pill">
            <span className="pill-dot"></span>
            <span>Device: <strong>{latest?.device_id || "raspi4b-01"}</strong></span>
          </div>
          <button
            className={`refresh-btn ${autoRefresh ? "active" : ""}`}
            onClick={() => setAutoRefresh((prev) => !prev)}
            title={autoRefresh ? "Pause live streaming" : "Resume live streaming"}
          >
            {autoRefresh ? "⏸ Pause Polling" : "▶ Resume Live"}
          </button>
          <div className="last-sync">Updated: {lastRefreshed || "--"}</div>
        </div>
      </div>

      {error && (
        <div className="rtaqi-alert">
          <div className="alert-icon">⚠️</div>
          <div>
            <strong>Stream Notification:</strong> {error}
            <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.85 }}>
              If your Raspberry Pi script just started, allow a few seconds for the initial reading to record to the database.
            </div>
          </div>
        </div>
      )}

      {/* Hero Overview: Live AQI & Hardware Diagnostics */}
      <div className="rtaqi-hero-grid">
        <div className="rtaqi-hero-card aqi-highlight-card" style={{ borderColor: aqiCat.color }}>
          <div className="card-top-label">ESTIMATED REAL-TIME AQI</div>
          <div className="aqi-display">
            <div className="aqi-big-number" style={{ color: aqiCat.color }}>
              {aqiValue !== null ? aqiValue : "--"}
            </div>
            <div className="aqi-status-box">
              <span className="aqi-category-badge" style={{ backgroundColor: aqiCat.bg, color: aqiCat.color, borderColor: aqiCat.color }}>
                {aqiCat.label}
              </span>
              <p className="aqi-desc">{aqiCat.desc}</p>
            </div>
          </div>
          <div className="reading-time">
            Timestamp: {latest?.recorded_at ? new Date(latest.recorded_at).toLocaleString() : "Awaiting transmission..."}
          </div>
        </div>

        <div className="rtaqi-hero-card telemetry-card">
          <div className="card-top-label">HARDWARE SENSORS HEALTH</div>
          <div className="telemetry-badges">
            <div className="telemetry-item">
              <span className="sensor-name">ADS1115 #1 (CO, NH3, NO2, O3)</span>
              <span className={`status-tag ${latest?.ads1_status === "OK" ? "status-ok" : "status-warn"}`}>
                {latest?.ads1_status || "WAITING"}
              </span>
            </div>
            <div className="telemetry-item">
              <span className="sensor-name">ADS1115 #2 (SO2)</span>
              <span className={`status-tag ${latest?.ads2_status === "OK" ? "status-ok" : "status-warn"}`}>
                {latest?.ads2_status || "WAITING"}
              </span>
            </div>
            <div className="telemetry-item">
              <span className="sensor-name">PMS5003 (Laser Particulate)</span>
              <span className={`status-tag ${latest?.pms_status === "OK" ? "status-ok" : "status-warn"}`}>
                {latest?.pms_status || "WAITING"}
              </span>
            </div>
            <div className="telemetry-item">
              <span className="sensor-name">GPS Module</span>
              <span className={`status-tag ${latest?.gps_status === "FIX" ? "status-ok" : "status-warn"}`}>
                {latest?.gps_status || "NO FIX"}
              </span>
            </div>
          </div>

          <div className="gps-location-bar">
            <span className="gps-icon">📍</span>
            <span>
              Coordinates: {latest?.lat && latest?.lon ? `${latest.lat}° N, ${latest.lon}° E` : "Acquiring GPS fix (Outdoor clear sky recommended)"}
            </span>
          </div>
        </div>
      </div>

      {/* Particulate Matter Section */}
      <div className="rtaqi-section-title">
        <span>PARTICULATE MATTER (µg/m³)</span>
      </div>
      <div className="metrics-grid">
        <div className="metric-card pm-card">
          <div className="metric-header">
            <span className="metric-name">PM2.5</span>
            <span className="metric-type">Fine Particles</span>
          </div>
          <div className="metric-main-val">
            {latest?.pm25 != null ? Number(latest.pm25).toFixed(2) : "--"}
            <span className="metric-unit">µg/m³</span>
          </div>
          <div className="metric-bar-bg">
            <div
              className="metric-bar-fill"
              style={{
                width: `${Math.min(((latest?.pm25 || 0) / 250) * 100, 100)}%`,
                backgroundColor: (latest?.pm25 || 0) > 60 ? "#ef4444" : "#10b981",
              }}
            ></div>
          </div>
          <div className="metric-footer">PMS5003 Optical Laser Detection</div>
        </div>

        <div className="metric-card pm-card">
          <div className="metric-header">
            <span className="metric-name">PM10</span>
            <span className="metric-type">Coarse Particles</span>
          </div>
          <div className="metric-main-val">
            {latest?.pm10 != null ? Number(latest.pm10).toFixed(2) : "--"}
            <span className="metric-unit">µg/m³</span>
          </div>
          <div className="metric-bar-bg">
            <div
              className="metric-bar-fill"
              style={{
                width: `${Math.min(((latest?.pm10 || 0) / 400) * 100, 100)}%`,
                backgroundColor: (latest?.pm10 || 0) > 100 ? "#f97316" : "#10b981",
              }}
            ></div>
          </div>
          <div className="metric-footer">PMS5003 Optical Laser Detection</div>
        </div>
      </div>

      {/* Gas Sensors Section */}
      <div className="rtaqi-section-title">
        <span>GAS CONCENTRATION & ELECTROCHEMICAL TELEMETRY</span>
      </div>
      <div className="metrics-grid gas-metrics-grid">
        {/* CO */}
        <div className="metric-card gas-card">
          <div className="metric-header">
            <span className="metric-name">CO (Carbon Monoxide)</span>
            <span className="sensor-tag">MiCS-6814 RED</span>
          </div>
          <div className="metric-main-val">
            {latest?.co_ppm != null ? Number(latest.co_ppm).toFixed(3) : "--"}
            <span className="metric-unit">PPM</span>
          </div>
          <div className="telemetry-subdata">
            <div>Voltage: <strong>{latest?.co_voltage != null ? `${Number(latest.co_voltage).toFixed(3)} V` : "--"}</strong></div>
            <div>Rs: <strong>{latest?.co_rs != null ? `${Number(latest.co_rs).toFixed(2)} kΩ` : "--"}</strong></div>
            <div>Rs/R0: <strong>{latest?.co_ratio != null ? Number(latest.co_ratio).toFixed(3) : "--"}</strong></div>
          </div>
        </div>

        {/* NO2 */}
        <div className="metric-card gas-card">
          <div className="metric-header">
            <span className="metric-name">NO2 (Nitrogen Dioxide)</span>
            <span className="sensor-tag">MiCS-6814 OX</span>
          </div>
          <div className="metric-main-val">
            {latest?.no2_ppm != null ? Number(latest.no2_ppm).toFixed(3) : "--"}
            <span className="metric-unit">PPM</span>
          </div>
          <div className="telemetry-subdata">
            <div>Voltage: <strong>{latest?.no2_voltage != null ? `${Number(latest.no2_voltage).toFixed(3)} V` : "--"}</strong></div>
            <div>Rs: <strong>{latest?.no2_rs != null ? `${Number(latest.no2_rs).toFixed(2)} kΩ` : "--"}</strong></div>
            <div>Rs/R0: <strong>{latest?.no2_ratio != null ? Number(latest.no2_ratio).toFixed(3) : "--"}</strong></div>
          </div>
        </div>

        {/* NH3 */}
        <div className="metric-card gas-card">
          <div className="metric-header">
            <span className="metric-name">NH3 (Ammonia)</span>
            <span className="sensor-tag">MiCS-6814 NH3</span>
          </div>
          <div className="metric-main-val">
            {latest?.nh3_ppm != null ? Number(latest.nh3_ppm).toFixed(3) : "--"}
            <span className="metric-unit">PPM</span>
          </div>
          <div className="telemetry-subdata">
            <div>Voltage: <strong>{latest?.nh3_voltage != null ? `${Number(latest.nh3_voltage).toFixed(3)} V` : "--"}</strong></div>
            <div>Rs: <strong>{latest?.nh3_rs != null ? `${Number(latest.nh3_rs).toFixed(2)} kΩ` : "--"}</strong></div>
            <div>Rs/R0: <strong>{latest?.nh3_ratio != null ? Number(latest.nh3_ratio).toFixed(3) : "--"}</strong></div>
          </div>
        </div>

        {/* O3 */}
        <div className="metric-card gas-card">
          <div className="metric-header">
            <span className="metric-name">Ozone (O3)</span>
            <span className="sensor-tag">MQ-131</span>
          </div>
          <div className="metric-main-val">
            {latest?.o3_ppm != null ? Number(latest.o3_ppm).toFixed(4) : "--"}
            <span className="metric-unit">PPM</span>
          </div>
          <div className="telemetry-subdata">
            <div>Voltage: <strong>{latest?.mq131_voltage != null ? `${Number(latest.mq131_voltage).toFixed(3)} V` : "--"}</strong></div>
            <div>Rs: <strong>{latest?.o3_rs != null ? `${Number(latest.o3_rs).toFixed(2)} kΩ` : "--"}</strong></div>
            <div>Rs/R0: <strong>{latest?.o3_ratio != null ? Number(latest.o3_ratio).toFixed(3) : "--"}</strong></div>
          </div>
        </div>

        {/* SO2 */}
        <div className="metric-card gas-card">
          <div className="metric-header">
            <span className="metric-name">SO2 (Sulfur Dioxide)</span>
            <span className="sensor-tag">MQ-136</span>
          </div>
          <div className="metric-main-val">
            {latest?.so2_ppm != null ? Number(latest.so2_ppm).toFixed(3) : "--"}
            <span className="metric-unit">PPM</span>
          </div>
          <div className="telemetry-subdata">
            <div>Voltage: <strong>{latest?.mq136_voltage != null ? `${Number(latest.mq136_voltage).toFixed(3)} V` : "--"}</strong></div>
            <div>Rs: <strong>{latest?.so2_rs != null ? `${Number(latest.so2_rs).toFixed(2)} kΩ` : "--"}</strong></div>
            <div>Rs/R0: <strong>{latest?.so2_ratio != null ? Number(latest.so2_ratio).toFixed(3) : "--"}</strong></div>
          </div>
        </div>
      </div>

      {/* Historical Real-Time Charts */}
      <div className="rtaqi-charts-section">
        <div className="rtaqi-chart-card">
          <div className="chart-header">
            <h3>Particulate Matter Live Stream (PM2.5 / PM10)</h3>
            <span className="chart-tag">µg/m³ vs Time</span>
          </div>
          <div className="chart-wrapper">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="pm25" stroke="#f59e0b" name="PM 2.5" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="pm10" stroke="#8b5cf6" name="PM 10" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-placeholder">Collecting telemetry samples from backend...</div>
            )}
          </div>
        </div>

        <div className="rtaqi-chart-card">
          <div className="chart-header">
            <h3>Gaseous Concentrations Live Trend (PPM)</h3>
            <span className="chart-tag">PPM vs Time</span>
          </div>
          <div className="chart-wrapper">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={history} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="co" stroke="#ef4444" name="CO" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="no2" stroke="#eab308" name="NO2" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="nh3" stroke="#10b981" name="NH3" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="o3" stroke="#06b6d4" name="O3" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="so2" stroke="#ec4899" name="SO2" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-placeholder">Collecting telemetry samples from backend...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
