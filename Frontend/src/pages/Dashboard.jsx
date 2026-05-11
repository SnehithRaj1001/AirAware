import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { userAPI, publicAPI } from "../api.js";
import StationCard from "../components/StationCard.jsx";
import "./Dashboard.css";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [news, setNews] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [dashboard, trends, newsData, stationsData] = await Promise.all([
          userAPI.getDashboard(),
          userAPI.getTrends(),
          publicAPI.getNews(),
          publicAPI.getAllStations(),
        ]);

        setDashboardData(dashboard.data);
        setTrendsData(trends.data);
        setNews(newsData.data);
        setStations(stationsData.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getAqiLevel = (pm25) => {
    if (pm25 <= 50) return "Good";
    if (pm25 <= 100) return "Satisfactory";
    if (pm25 <= 200) return "Moderately Polluted";
    if (pm25 <= 300) return "Poor";
    return "Very Poor";
  };

  const getAqiColor = (pm25) => {
    if (pm25 <= 50) return "#10b981";
    if (pm25 <= 100) return "#f59e0b";
    if (pm25 <= 200) return "#f97316";
    if (pm25 <= 300) return "#ef4444";
    return "#7c2d12";
  };

  if (loading) {
    return (
      <main className="page-shell">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell">
        <div className="error-box">{error}</div>
      </main>
    );
  }

  const userTrends = trendsData?.data || [];
  const latestAqi = dashboardData?.latestAqi;

  return (
    <main className="page-shell dashboard-main">
      {/* User Welcome Section */}
      <section className="welcome-section">
        <div>
          <h1>
            Welcome, {dashboardData?.user?.firstName}{" "}
            {dashboardData?.user?.lastName}!
          </h1>
          <p>
            Monitoring air quality in{" "}
            <strong>{dashboardData?.user?.location}</strong>
          </p>
        </div>
      </section>

      {/* Current AQI Card */}
      {latestAqi && (
        <section className="current-aqi-section">
          <div className="aqi-card-container">
            <div
              className="aqi-card-main"
              style={{ borderColor: getAqiColor(latestAqi.pm25) }}
            >
              <div className="aqi-header">
                <h2>{dashboardData?.station?.station_name}</h2>
                <span
                  className="aqi-level-badge"
                  style={{ backgroundColor: getAqiColor(latestAqi.pm25) }}
                >
                  {getAqiLevel(latestAqi.pm25)}
                </span>
              </div>

              <div className="aqi-grid">
                <div className="aqi-item">
                  <span className="aqi-label">PM2.5</span>
                  <strong className="aqi-value">
                    {latestAqi.pm25 != null ? latestAqi.pm25.toFixed(1) : "--"}
                  </strong>
                  <span className="aqi-unit">µg/m³</span>
                </div>
                <div className="aqi-item">
                  <span className="aqi-label">PM10</span>
                  <strong className="aqi-value">
                    {latestAqi.pm10 != null ? latestAqi.pm10.toFixed(1) : "--"}
                  </strong>
                  <span className="aqi-unit">µg/m³</span>
                </div>
                <div className="aqi-item">
                  <span className="aqi-label">O₃</span>
                  <strong className="aqi-value">
                    {latestAqi.o3 != null ? latestAqi.o3.toFixed(1) : "--"}
                  </strong>
                  <span className="aqi-unit">ppb</span>
                </div>
                <div className="aqi-item">
                  <span className="aqi-label">NO₂</span>
                  <strong className="aqi-value">
                    {latestAqi.no2 != null ? latestAqi.no2.toFixed(1) : "--"}
                  </strong>
                  <span className="aqi-unit">ppb</span>
                </div>
                <div className="aqi-item">
                  <span className="aqi-label">SO₂</span>
                  <strong className="aqi-value">
                    {latestAqi.so2 != null ? latestAqi.so2.toFixed(1) : "--"}
                  </strong>
                  <span className="aqi-unit">ppb</span>
                </div>
                <div className="aqi-item">
                  <span className="aqi-label">CO</span>
                  <strong className="aqi-value">
                    {latestAqi.co != null ? latestAqi.co.toFixed(1) : "--"}
                  </strong>
                  <span className="aqi-unit">ppm</span>
                </div>
              </div>

              <div className="aqi-footer">
                <small>
                  Last updated: {new Date(latestAqi.date).toLocaleString()}
                </small>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trends Chart Section */}
      {userTrends.length > 0 && (
        <section className="trends-chart-section">
          <h2>30-Day Trends</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userTrends}>
                <defs>
                  <linearGradient id="colorPm25" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPm10" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(date) =>
                    new Date(date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  }
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="pm25"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorPm25)"
                  name="PM2.5"
                />
                <Area
                  type="monotone"
                  dataKey="pm10"
                  stroke="#f97316"
                  fillOpacity={1}
                  fill="url(#colorPm10)"
                  name="PM10"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <div className="dashboard-grid">
        {/* News Section */}
        <section className="news-section">
          <h2>Air Quality News</h2>
          <div className="news-list">
            {news.map((item) => (
              <article
                key={item.id}
                className={`news-card news-${item.severity}`}
              >
                <div className="news-badge">{item.severity.toUpperCase()}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <small>
                  {new Date(item.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </small>
              </article>
            ))}
          </div>
        </section>

        {/* Nearby Stations Section */}
        <section className="stations-section">
          <h2>Nearby Stations</h2>
          <div className="nearby-stations">
            {stations.slice(0, 4).map((station) => (
              <div key={station.id} className="station-preview">
                <h4>{station.stationName}</h4>
                {station.latestAqi ? (
                  <div className="station-aqi-preview">
                    <span className="pm25-value">
                      PM2.5: {station.latestAqi.pm25?.toFixed(1)}
                    </span>
                    <span className="aqi-level">
                      {getAqiLevel(station.latestAqi.pm25)}
                    </span>
                  </div>
                ) : (
                  <p className="no-data">No data available</p>
                )}
              </div>
            ))}
          </div>
          <Link to="/trends" className="view-all-link">
            View All Stations →
          </Link>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
