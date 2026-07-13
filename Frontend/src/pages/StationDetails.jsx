import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchLatestAqi, fetchAqiTrends } from "../api.js";
import PollutantChart from "../components/PollutantChart.jsx";

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

  if (loading) return <div className="page-shell"><div className="spinner"></div></div>;
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
      <div className="section-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800 }}>{station.station_name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time Air Quality Monitoring & Analysis</p>
        </div>
        <div>
          <Link to="/" className="secondary-button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>←</span> Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="station-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        {/* Main Content */}
        <div className="details-main">
          {/* AQI Hero Card */}
          <div className="aqi-hero" style={{ 
            background: status.bg, 
            padding: '40px', 
            borderRadius: 'var(--radius-lg)', 
            border: `1px solid ${status.color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: status.color, letterSpacing: '1px' }}>Current Air Quality</span>
              <h2 style={{ fontSize: '48px', fontWeight: 900, color: '#0f172a', margin: '8px 0' }}>{status.label}</h2>
              <p style={{ color: '#64748b', maxWidth: '300px' }}>The overall air quality index is currently {status.label.toLowerCase()} for this location.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                background: '#fff', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                border: `4px solid ${status.color}`
              }}>
                <span style={{ fontSize: '36px', fontWeight: 900, color: status.color }}>{aqiValue}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>AQI</span>
              </div>
            </div>
          </div>

          {/* Pollutant Breakdown */}
          <div className="pollutant-breakdown" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Detailed Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {pollutants.map((p) => (
                <div key={p.key} style={{ background: '#fff', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>{p.label}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{p.unit}</span>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>
                    {p.value !== null ? p.value : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Chart */}
          <div className="trend-section" style={{ background: '#fff', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Historical Trends (Recent)</h3>
            <PollutantChart 
              data={trends} 
              pollutants={['pm25', 'pm10', 'no2', 'nh3', 'so2', 'co', 'o3']} 
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="details-sidebar">
          <div className="sidebar-card" style={{ background: '#fff', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Health Advice</h3>
            <div style={{ padding: '16px', background: 'var(--accent-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-border)' }}>
              <p style={{ fontSize: '14px', color: 'var(--accent)', lineHeight: 1.6 }}>
                {aqiValue <= 100 
                  ? "Air quality is considered satisfactory, and air pollution poses little or no risk."
                  : "Members of sensitive groups may experience health effects. The general public is less likely to be affected."}
              </p>
            </div>
            <ul style={{ marginTop: '20px', paddingLeft: '20px', fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>Outdoor activities are encouraged</li>
              <li>Ventilate your home frequently</li>
              <li>Minimal risk for sensitive groups</li>
            </ul>
          </div>

          <div className="sidebar-card" style={{ background: '#0f172a', padding: '24px', borderRadius: 'var(--radius-lg)', color: '#fff' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Station Information</h3>
            <div style={{ fontSize: '14px', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px' }}>File Reference</span>
                <span>{station.file_name}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px' }}>Last Updated</span>
                <span>{new Date(latest.date).toLocaleString()}</span>
              </div>
              <div style={{ marginTop: '8px' }}>
                <Link to="/trends" className="primary-button" style={{ width: '100%', textAlign: 'center', background: 'var(--accent)', border: 'none' }}>
                  Full Analysis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default StationDetails;
