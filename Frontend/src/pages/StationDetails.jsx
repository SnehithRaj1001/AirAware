import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchLatestAqi, fetchAqiTrends, userAPI } from "../api.js";
import PollutantChart from "../components/PollutantChart.jsx";
import { StationDetailsSkeleton } from "../components/Skeleton.jsx";
import { getIndianAqiBand } from "../utils/aqiStandards.js";
import "./StationDetails.css";

const StationDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [userAdvisory, setUserAdvisory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStationData = async () => {
      try {
        setLoading(true);
        const promises = [
          fetchLatestAqi(id),
          fetchAqiTrends(id)
        ];

        const token = localStorage.getItem("authToken");
        if (token) {
          promises.push(userAPI.getAdvisory(id).catch(() => null));
        }

        const [latestPayload, trendsPayload, advPayload] = await Promise.all(promises);
        
        setData(latestPayload);
        setTrends(trendsPayload.trends.map(t => ({
          ...t,
          o3: t.o3 ?? t.ozone,
          date: new Date(t.date).toLocaleDateString()
        })));

        if (advPayload?.data?.advisory) {
          setUserAdvisory({
            ...advPayload.data.advisory,
            aiInsights: advPayload.data.aiInsights || advPayload.data.advisory.aiInsights,
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadStationData();
  }, [id]);

  if (loading) return <StationDetailsSkeleton />;
  if (error) return <div className="page-shell"><div className="error-box">{error}</div></div>;
  if (!data) return <div className="page-shell">No data found</div>;

  const { station, latest } = data;
  const aqiValue = Math.round(latest.aqi) || 0;

  const status = getIndianAqiBand(aqiValue);


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
          <Link to="/stations" className="secondary-button">
            <span>←</span> Back to Stations
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
          {userAdvisory ? (
            <div
              className="sidebar-card sidebar-card-light personalized-advisory-card"
              style={{
                borderColor: `${userAdvisory.riskColor}60`,
                background: "var(--bg-card)",
                boxShadow: `0 4px 20px -2px ${userAdvisory.riskColor}20`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px' }}>
                  <span>🛡️</span> Your Advisory
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: userAdvisory.riskColor,
                    background: `${userAdvisory.riskColor}18`,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    border: `1px solid ${userAdvisory.riskColor}50`,
                  }}
                >
                  {userAdvisory.riskLevel} • {userAdvisory.overallRiskScore}/100
                </span>
              </div>

              {userAdvisory.activeAlerts?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {userAdvisory.activeAlerts.map((alt, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: userAdvisory.riskColor,
                        background: `${userAdvisory.riskColor}14`,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: `1px solid ${userAdvisory.riskColor}40`,
                      }}
                    >
                      ⚠️ {alt}
                    </span>
                  ))}
                </div>
              )}

              <div
                className="health-advice-box"
                style={{
                  background: `${userAdvisory.riskColor}12`,
                  border: `1px solid ${userAdvisory.riskColor}35`,
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <p style={{ color: 'var(--text-main)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                  {userAdvisory.riskSummary}
                </p>
              </div>

              <ul className="health-advice-list" style={{ marginTop: '16px', gap: '10px' }}>
                <li><strong style={{ color: 'var(--text-main)' }}>Activity:</strong> {userAdvisory.directives.outdoor}</li>
                <li><strong style={{ color: 'var(--text-main)' }}>Mask:</strong> {userAdvisory.directives.mask}</li>
                <li><strong style={{ color: 'var(--text-main)' }}>Ventilation:</strong> {userAdvisory.directives.ventilation}</li>
                {userAdvisory.directives.medication && (
                  <li><strong style={{ color: 'var(--text-main)' }}>Medical:</strong> {userAdvisory.directives.medication}</li>
                )}
              </ul>

              {userAdvisory.aiInsights && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(147, 51, 234, 0.08))',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px' }}>✨</span>
                    <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent)' }}>
                      AI Medical Synthesis
                    </strong>
                  </div>
                  <div style={{ fontSize: '12.5px', lineHeight: '1.5', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(() => {
                      const clean = userAdvisory.aiInsights.trim();
                      const regex = /(?:^|\n|\s)(\d+)\.\s+([\s\S]*?)(?=(?:\s\d+\.\s+)|(?:\n\s*\*(?:Note|Warning))|$)/gi;
                      const items = [];
                      let m;
                      while ((m = regex.exec(clean)) !== null) {
                        items.push({ num: m[1], txt: m[2].trim() });
                      }

                      const renderBold = (str) => {
                        return str.split(/(\*\*.*?\*\*)/g).map((chunk, i) => {
                          if (chunk.startsWith('**') && chunk.endsWith('**')) {
                            return <strong key={i} style={{ color: 'var(--primary)' }}>{chunk.slice(2, -2)}</strong>;
                          }
                          return chunk;
                        });
                      };

                      if (items.length > 0) {
                        return items.map((it, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '8px 10px',
                              background: 'var(--bg-main)',
                              borderRadius: '6px',
                              borderLeft: '3px solid var(--accent)',
                              fontSize: '12px',
                              lineHeight: '1.45',
                            }}
                          >
                            <strong>{it.num}. </strong> {renderBold(it.txt)}
                          </div>
                        ));
                      }

                      return clean.split(/\n\s*\n/).map((p, idx) => (
                        <p key={idx} style={{ margin: 0 }}>{renderBold(p.trim())}</p>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          ) : (
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
          )}

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <Link to={`/trends?stationId=${id}`} className="sidebar-action-btn">
                📈 Full Analysis
              </Link>
              <Link to={`/compare?mode=station&stationIds=${id}`} className="sidebar-action-btn" style={{ background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', textAlign: 'center' }}>
                ⚖️ Compare Station
              </Link>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
};

export default StationDetails;
