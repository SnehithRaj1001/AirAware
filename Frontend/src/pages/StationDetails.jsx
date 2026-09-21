import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchLatestAqi, fetchAqiTrends } from "../api.js";
import PollutantChart from "../components/PollutantChart.jsx";
import "./StationDetails.css";

const StationDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStationData = async () => {
      try {
        setLoading(true);
        const [latestPayload, trendsPayload] = await Promise.all([
          fetchLatestAqi(id),
          fetchAqiTrends(id)
        ]);
        
        setData(latestPayload);
        setTrends(trendsPayload.trends.map(t => ({
          ...t,
          o3: t.o3 ?? t.ozone,
          date: new Date(t.date).toLocaleDateString()
        })));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadStationData();
  }, [id]);

  if (loading) return <div className="page-shell"><div className="loading-container"><div className="spinner"></div></div></div>;
  if (error) return <div className="page-shell"><div className="error-box">{error}</div></div>;
  if (!data) return <div className="page-shell">No data found</div>;

  const { station, latest } = data;
  const aqiValue = Math.round(latest.aqi) || 0;

  const getStatus = (val) => {
    if (val <= 50) return { label: "Good", color: "#22c55e", bg: "#f0fdf4" };
    if (val <= 100) return { label: "Satisfactory", color: "#f59e0b", bg: "#fffbeb" };
    if (val <= 200) return { label: "Moderate", color: "#ef4444", bg: "#fef2f2" };
    return { label: "Poor", color: "#7f1d1d", bg: "#fee2e2" };
  };

  const status = getStatus(aqiValue);

  const pollutants = [
    { key: "pm25", label: "PM2.5", value: latest.pm25, unit: "µg/m³" },
    { key: "pm10", label: "PM10", value: latest.pm10, unit: "µg/m³" },
    { key: "no2", label: "NO₂", value: latest.no2, unit: "µg/m³" },
    { key: "nh3", label: "NH₃", value: latest.nh3, unit: "µg/m³" },
    { key: "so2", label: "SO₂", value: latest.so2, unit: "µg/m³" },
    { key: "co", label: "CO", value: latest.co, unit: "mg/m³" },
    { key: "ozone", label: "Ozone", value: latest.ozone, unit: "µg/m³" },
  ];

  return (
    <main className="page-shell">
      <div className="station-details-header">
        <div>
          <h1>{station.station_name}</h1>
          <p>Real-time Air Quality Monitoring & Analysis</p>
        </div>
        <div>
          <Link to="/" className="secondary-button">
            <span>←</span> Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="station-details-grid">
        {/* Main Content */}
        <div className="details-main">
          {/* AQI Hero Card */}
          <div className="aqi-hero" style={{ background: status.bg, border: `1px solid ${status.color}20` }}>
            <div className="aqi-hero-text">
              <span className="aqi-hero-label" style={{ color: status.color }}>Current Air Quality</span>
              <h2 className="aqi-hero-status">{status.label}</h2>
              <p className="aqi-hero-desc">The overall air quality index is currently {status.label.toLowerCase()} for this location.</p>
            </div>
            <div>
              <div className="aqi-circle" style={{ borderColor: status.color }}>
                <span className="aqi-circle-value" style={{ color: status.color }}>{aqiValue}</span>
                <span className="aqi-circle-label">AQI</span>
              </div>
            </div>
          </div>

          {/* Pollutant Breakdown */}
          <div className="pollutant-breakdown">
            <h3>Detailed Breakdown</h3>
            <div className="pollutant-grid">
              {pollutants.map((p) => (
                <div key={p.key} className="pollutant-card">
                  <div className="pollutant-card-header">
                    <span>{p.label}</span>
                    <span>{p.unit}</span>
                  </div>
                  <div className="pollutant-card-value">
                    {p.value !== null ? p.value : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Charts — Grouped by Relativity */}
          <div className="station-trend-section">
            <h3>Historical Trends (Recent)</h3>

            {pollutants.map((p) => {
              const chartKey = p.key === "ozone" ? "o3" : p.key;
              const dotColor = {
                pm25: "#0066ff",
                pm10: "#10b981",
                o3: "#f59e0b",
                ozone: "#f59e0b",
                no2: "#6366f1",
                so2: "#8b5cf6",
                co: "#64748b",
                nh3: "#ec4899",
              }[p.key] || "#0066ff";

              return (
                <div key={p.key} className="chart-group">
                  <div className="chart-group-label">
                    <span className="chart-group-dot" style={{ background: dotColor }}></span>
                    <h4>{p.label}</h4>
                    <span className="chart-group-unit">{p.unit}</span>
                  </div>
                  <PollutantChart data={trends} pollutants={[chartKey]} height={260} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="details-sidebar">
          <div className="sidebar-card sidebar-card-light">
            <h3>Health Advice</h3>
            <div className="health-advice-box">
              <p>
                {aqiValue <= 100 
                  ? "Air quality is considered satisfactory, and air pollution poses little or no risk."
                  : "Members of sensitive groups may experience health effects. The general public is less likely to be affected."}
              </p>
            </div>
            <ul className="health-advice-list">
              <li>Outdoor activities are encouraged</li>
              <li>Ventilate your home frequently</li>
              <li>Minimal risk for sensitive groups</li>
            </ul>
          </div>

          <div className="sidebar-card sidebar-card-dark">
            <h3>Station Information</h3>
            <div className="station-info-field">
              <span className="station-info-label">File Reference</span>
              <span className="station-info-value">{station.file_name}</span>
            </div>
            <div className="station-info-field">
              <span className="station-info-label">Last Updated</span>
              <span className="station-info-value">{new Date(latest.date).toLocaleString()}</span>
            </div>
            <Link to="/trends" className="sidebar-action-btn">
              Full Analysis
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default StationDetails;
