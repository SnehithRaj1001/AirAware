import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
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
import { UserDashboardSkeleton } from "../components/Skeleton.jsx";
import { getIndianAqiBand, getIndianAqiColor, getIndianAqiLabel } from "../utils/aqiStandards.js";
import HealthAdvisoryWidget from "../components/HealthAdvisoryWidget.jsx";
import "./UserDashboard.css";



const UserDashboard = () => {
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

  const [userCoords, setUserCoords] = useState(null);

  // Haversine formula to compute distance in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          // Geolocation denied or unavailable; fallback will use user's assigned station coordinates
        },
        { timeout: 8000 }
      );
    }
  }, []);

  const getAqiLevel = (pm25) => getIndianAqiLabel(pm25);
  const getAqiColor = (pm25) => getIndianAqiColor(pm25);


  if (loading) {
    return <UserDashboardSkeleton />;
  }

  if (error) {
    return (
      <main className="page-shell">
        <div className="error-box">{error}</div>
      </main>
    );
  }

  // Compute ranked stations based on proximity to user
  const baseLat = userCoords?.latitude ?? dashboardData?.station?.latitude;
  const baseLon = userCoords?.longitude ?? dashboardData?.station?.longitude;

  const rankedStations = stations
    .map((station) => {
      const dist =
        baseLat != null && baseLon != null && station.latitude != null && station.longitude != null
          ? calculateDistance(baseLat, baseLon, station.latitude, station.longitude)
          : null;
      return { ...station, distanceKm: dist };
    })
    .sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });

  // Nearest station fallback: closest station with AQI, or user's assigned dashboard station
  const nearestStation = rankedStations.find((s) => s.latestAqi) || rankedStations[0] || dashboardData?.station;
  const activeStation = nearestStation || dashboardData?.station;
  const activeStationAqi = activeStation?.latestAqi || dashboardData?.latestAqi;
  const userTrends = trendsData?.data || [];

  // Calculate final/composite AQI for the active station
  const activeOverallAqi = activeStationAqi?.aqi != null
    ? Math.round(Number(activeStationAqi.aqi))
    : (activeStationAqi?.pm25 != null
      ? Math.round(Number(activeStationAqi.pm25))
      : (dashboardData?.healthAdvisory?.predictedAqi || 50));
  const activeAqiBand = getIndianAqiBand(activeOverallAqi);

  const stationPollutants = [
    { key: "pm25", label: "PM2.5", value: activeStationAqi?.pm25, unit: "µg/m³" },
    { key: "pm10", label: "PM10", value: activeStationAqi?.pm10, unit: "µg/m³" },
    { key: "no2", label: "NO₂", value: activeStationAqi?.no2, unit: "ppb" },
    { key: "nh3", label: "NH₃", value: activeStationAqi?.nh3, unit: "µg/m³" },
    { key: "so2", label: "SO₂", value: activeStationAqi?.so2, unit: "ppb" },
    { key: "co", label: "CO", value: activeStationAqi?.co, unit: "ppm" },
    { key: "o3", label: "Ozone", value: activeStationAqi?.o3 ?? activeStationAqi?.ozone, unit: "ppb" },
  ];

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
            Air quality near <strong>{dashboardData?.user?.location || "you"}</strong>
            {userCoords && <span className="location-pill live-gps-pill">📍 Live GPS Active</span>}
          </p>
        </div>
      </section>

      {/* Current AQI Card for Nearest Station */}
      {activeStationAqi && (
        <section className="current-aqi-section">
          <div className="aqi-card-container">
            <div
              className="aqi-card-main"
              style={{ borderColor: activeAqiBand.color }}
            >
              <div className="aqi-header">
                <div>
                  <div className="nearest-badge-tag">
                    <span>🎯 Nearest Station</span>
                    {activeStation?.distanceKm != null && (
                      <span className="nearest-distance-val">
                        • {activeStation.distanceKm < 1
                          ? `${Math.round(activeStation.distanceKm * 1000)} m away`
                          : `${activeStation.distanceKm.toFixed(1)} km away`}
                      </span>
                    )}
                  </div>
                  <h2>{activeStation?.stationName || activeStation?.station_name}</h2>
                  {activeStation?.address && (
                    <p className="station-address-sub">{activeStation.address}</p>
                  )}
                </div>

                <div className="aqi-header-right">
                  <div
                    className="aqi-circle"
                    style={{
                      borderColor: activeAqiBand.color,
                      color: activeAqiBand.color,
                    }}
                  >
                    <span className="aqi-circle-value">{activeOverallAqi}</span>
                    <span className="aqi-circle-label">AQI</span>
                  </div>

                  <span
                    className="aqi-level-badge"
                    style={{
                      backgroundColor: activeAqiBand.color,
                      boxShadow: `0 4px 14px ${activeAqiBand.color}35`,
                    }}
                  >
                    {activeAqiBand.label}
                  </span>
                </div>
              </div>

              <div className="aqi-grid pollutant-cards-row">
                {stationPollutants.map((p) => (
                  <div key={p.key} className="pollutant-card">
                    <div className="pollutant-card-header">
                      <span>{p.label}</span>
                      <span>{p.unit}</span>
                    </div>
                    <div className="pollutant-card-value">
                      {p.value != null && !isNaN(p.value) ? Number(p.value).toFixed(2) : "--"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="aqi-footer">
                <small>
                  {activeStationAqi.date ? `Last updated: ${new Date(activeStationAqi.date).toLocaleString()}` : "Live telemetry"}
                </small>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Personalized Health Advisory Widget */}
      {dashboardData?.healthAdvisory && (
        <HealthAdvisoryWidget
          advisory={dashboardData.healthAdvisory}
          timeline={dashboardData.advisoryTimeline || []}
          aiInsights={dashboardData.aiInsights}
          user={dashboardData.user}
          station={activeStation}
          stations={stations}
          userCoords={userCoords}
        />
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
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-main)",
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
              <article key={item.id} className={`news-card news-${item.severity}`}>
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
          <div className="section-header-inline">
            <h2>Nearby Stations</h2>
            {userCoords ? (
              <span className="location-pill">📍 Live GPS</span>
            ) : dashboardData?.station?.latitude ? (
              <span className="location-pill">📍 Based on {dashboardData?.user?.location}</span>
            ) : null}
          </div>
          <div className="nearby-stations">
            {(() => {
              // Priority 1: User's GPS coords. Priority 2: User's home city station coords
              const baseLat = userCoords?.latitude ?? dashboardData?.station?.latitude;
              const baseLon = userCoords?.longitude ?? dashboardData?.station?.longitude;

              const rankedStations = stations
                .map((station) => {
                  const dist = (baseLat != null && baseLon != null && station.latitude != null && station.longitude != null)
                    ? calculateDistance(baseLat, baseLon, station.latitude, station.longitude)
                    : null;
                  return { ...station, distanceKm: dist };
                })
                .sort((a, b) => {
                  if (a.distanceKm == null && b.distanceKm == null) return 0;
                  if (a.distanceKm == null) return 1;
                  if (b.distanceKm == null) return -1;
                  return a.distanceKm - b.distanceKm;
                });

              return rankedStations.slice(0, 5).map((station, idx) => (
                <div key={station.id} className="station-preview">
                  <div className="station-header-row">
                    <div className="station-title-wrap">
                      <span className="station-rank-badge">#{idx + 1}</span>
                      <Link to={`/station/${station.id}`} className="station-name-link">
                        <h4>{station.stationName}</h4>
                      </Link>
                    </div>
                    {station.distanceKm != null && (
                      <span className="station-distance-chip">
                        {station.distanceKm < 1 
                          ? `${Math.round(station.distanceKm * 1000)} m away`
                          : `${station.distanceKm.toFixed(1)} km away`}
                      </span>
                    )}
                  </div>
                  {station.latestAqi ? (
                    <div className="station-aqi-preview">
                      <span className="pm25-value">
                        PM2.5: {station.latestAqi?.pm25 != null ? Number(station.latestAqi.pm25).toFixed(1) : "--"}
                      </span>
                      <span 
                        className="aqi-level"
                        style={{
                          backgroundColor: `${getAqiColor(station.latestAqi.pm25)}15`,
                          color: getAqiColor(station.latestAqi.pm25),
                          borderColor: `${getAqiColor(station.latestAqi.pm25)}40`
                        }}
                      >
                        {getAqiLevel(station.latestAqi.pm25)}
                      </span>
                    </div>
                  ) : (
                    <p className="no-data">No data available</p>
                  )}
                </div>
              ));
            })()}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
            <Link to="/stations" className="view-all-link">
              View All Stations List →
            </Link>
            <Link to="/map" className="view-all-link">
              Explore on Interactive Map →
            </Link>
          </div>
        </section>
      </div>
    </main>

  );
};

export default UserDashboard;
