import { useState } from "react";
import "./HealthAdvisoryWidget.css";

export default function HealthAdvisoryWidget({ advisory, timeline = [], aiInsights, user, station, stations = [], userCoords = null }) {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("verdict"); // "verdict" | "zones" | "timeline"

  if (!advisory) return null;

  const {
    overallRiskScore,
    riskLevel,
    riskColor,
    riskBg,
    riskSummary,
    directives,
    activeAlerts = [],
    breakdown,
  } = advisory;

  // Calculate distance utility
  const getDist = (lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const originLat = userCoords?.latitude ?? station?.latitude;
  const originLon = userCoords?.longitude ?? station?.longitude;

  // Filter stations within 35km radius
  const nearbyStations = stations
    .map((s) => {
      const d = getDist(originLat, originLon, s.latitude, s.longitude);
      const aqiVal = s.latestAqi?.aqi != null 
        ? Math.round(s.latestAqi.aqi) 
        : (s.latestAqi?.pm25 != null ? Math.round(s.latestAqi.pm25) : null);
      return {
        ...s,
        distanceKm: d,
        effectiveAqi: aqiVal,
      };
    })
    .filter((s) => s.distanceKm != null && s.distanceKm <= 35 && s.effectiveAqi != null)
    .sort((a, b) => (b.effectiveAqi || 0) - (a.effectiveAqi || 0)); // Worst air first

  const highRiskAvoidZones = nearbyStations.filter((s) => (s.effectiveAqi || 0) >= 101);
  const safePockets = nearbyStations.filter((s) => (s.effectiveAqi || 0) < 101);

  // Quick Outdoor Verdict calculation
  const getOutdoorVerdict = () => {
    if (overallRiskScore >= 75) {
      return {
        status: "STAY INDOORS",
        color: "#dc2626",
        badgeBg: "rgba(220, 38, 38, 0.15)",
        icon: "🚫",
        headline: "High Personal Vulnerability: Avoid Outdoor Exposure",
        subtitle: "Active air pollution levels will trigger or aggravate clinical symptoms today.",
      };
    }
    if (overallRiskScore >= 50) {
      return {
        status: "CAUTION ADVISED",
        color: "#ea580c",
        badgeBg: "rgba(234, 88, 12, 0.15)",
        icon: "⚠️",
        headline: "Limit Outdoor Activity & Protect Airway",
        subtitle: "Sensitive individuals should wear an N95 mask and avoid peak rush-hour exertion.",
      };
    }
    if (overallRiskScore >= 25) {
      return {
        status: "SAFE WITH CAUTION",
        color: "#d97706",
        badgeBg: "rgba(217, 119, 6, 0.15)",
        icon: "⛅",
        headline: "Mild Vulnerability: Safe for Routine Errands",
        subtitle: "Conditions are manageable. Take hydration breaks if doing high-intensity cardio.",
      };
    }
    return {
      status: "SAFE OUTDOORS",
      color: "#16a34a",
      badgeBg: "rgba(22, 163, 74, 0.15)",
      icon: "✅",
      headline: "Green Light for Outdoor Activities",
      subtitle: "Air quality and personal health profile permit open-air sports and full ventilation.",
    };
  };

  const verdict = getOutdoorVerdict();

  return (
    <>
      <section className="health-advisory-widget">
        <div className="advisory-accent-stripe" style={{ background: riskColor }}></div>

        <div className="advisory-header-row">
          <div className="advisory-title-group">
            <h2>
              <span>🛡️</span> Personalized Health Advisory
            </h2>
            <p>{riskSummary}</p>
          </div>

          <div className="risk-badge-cluster">
            <span
              className="risk-level-badge"
              style={{
                background: riskBg,
                color: riskColor,
                borderColor: `${riskColor}50`,
              }}
            >
              ● {riskLevel} Vulnerability
            </span>
            <span className="risk-score-pill">
              Risk Index: <strong>{overallRiskScore}</strong>/100
            </span>
          </div>
        </div>

        {/* Quick outdoor safety banner right on the widget */}
        <div
          style={{
            marginBottom: "18px",
            padding: "12px 18px",
            borderRadius: "10px",
            background: verdict.badgeBg,
            border: `1px solid ${verdict.color}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>{verdict.icon}</span>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: verdict.color }}>
                {verdict.status}: {verdict.headline}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                {verdict.subtitle}
              </div>
            </div>
          </div>
          {highRiskAvoidZones.length > 0 && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#ef4444",
                background: "rgba(239, 68, 68, 0.1)",
                padding: "4px 10px",
                borderRadius: "999px",
                border: "1px solid rgba(239, 68, 68, 0.25)",
              }}
            >
              ⚠️ {highRiskAvoidZones.length} hot-spot area{highRiskAvoidZones.length > 1 ? "s" : ""} to avoid (≤35km)
            </span>
          )}
        </div>

        {/* Personalized Alert Chips */}
        {activeAlerts.length > 0 && (
          <div className="alert-tags-row">
            {activeAlerts.map((tag, idx) => (
              <span key={idx} className="alert-tag-item">
                ⚠️ {tag}
              </span>
            ))}
          </div>
        )}

        {/* Directives Cards */}
        <div className="directives-grid">
          <div className="directive-card">
            <span className="directive-label">🏃 Physical Activity</span>
            <p className="directive-text">{directives.outdoor}</p>
          </div>

          <div className="directive-card">
            <span className="directive-label">😷 Mask Advisory</span>
            <p className="directive-text">{directives.mask}</p>
          </div>

          <div className="directive-card">
            <span className="directive-label">🪟 Indoor Ventilation</span>
            <p className="directive-text">{directives.ventilation}</p>
          </div>

          <div className="directive-card">
            <span className="directive-label">💊 Medical Precaution</span>
            <p className="directive-text">{directives.medication}</p>
          </div>
        </div>

        {/* Multi-Day Forecast-based Health Outlook (Upcoming Days) */}
        {timeline.length > 0 && (
          <div className="advisory-forecast-section" style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)' }}>
                📅 3-Day Health Risk Outlook (Forecasted)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                ML recursive rollout
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              {timeline.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${item.riskColor}35`,
                    background: 'var(--bg-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '12px' }}>
                      {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </strong>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: item.riskColor,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: `${item.riskColor}18`,
                      }}
                    >
                      {item.riskLevel}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Predicted AQI: <strong style={{ color: 'var(--primary)' }}>{item.predictedAqi}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.3' }}>
                    {item.outdoorAdvice.slice(0, 55)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Google AI Studio / Gemini Synthesized Clinical Insight */}
        {aiInsights && (
          <div
            className="advisory-ai-container"
            style={{
              marginTop: '20px',
              padding: '20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(147, 51, 234, 0.08))',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>✨</span>
                <strong style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)' }}>
                  Personalized AI Health Synthesis
                </strong>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                Powered by Gemini AI Studio
              </span>
            </div>

            <div
              className="ai-insights-content"
              style={{
                fontSize: '13.5px',
                lineHeight: '1.65',
                color: 'var(--text-main)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {(() => {
                const cleanText = aiInsights.trim();
                const firstItemMatch = cleanText.search(/(?:^|\n|\s)\d+\.\s+/);
                const intro = firstItemMatch > 0 ? cleanText.slice(0, firstItemMatch).trim() : null;
                const noteMatch = cleanText.match(/\*(?:Note|Warning)[\s\S]*?\*$/i);
                const footerNote = noteMatch ? noteMatch[0].replace(/^\*|\*$/g, '').trim() : null;

                const items = [];
                const regex = /(?:^|\n|\s)(\d+)\.\s+([\s\S]*?)(?=(?:\s\d+\.\s+)|(?:\n\s*\*(?:Note|Warning))|$)/gi;
                let match;
                while ((match = regex.exec(cleanText)) !== null) {
                  items.push({
                    number: match[1],
                    text: match[2].trim(),
                  });
                }

                const renderFormattedText = (rawStr) => {
                  const parts = rawStr.split(/(\*\*.*?\*\*)/g);
                  return parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i} style={{ color: 'var(--primary)' }}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  });
                };

                return (
                  <>
                    {intro && (
                      <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                        {renderFormattedText(intro)}
                      </p>
                    )}

                    {items.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '12px 16px',
                              background: 'var(--bg-card)',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              borderLeft: '4px solid var(--accent)',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                            }}
                          >
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: 'rgba(14, 165, 233, 0.15)',
                                color: 'var(--accent)',
                                fontWeight: 800,
                                fontSize: '11px',
                                flexShrink: 0,
                                marginTop: '2px',
                              }}
                            >
                              {item.number}
                            </span>
                            <div style={{ flex: 1, fontSize: '13.5px', lineHeight: '1.6' }}>
                              {renderFormattedText(item.text)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0 }}>{renderFormattedText(cleanText)}</p>
                    )}

                    {footerNote && (
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '10px 14px',
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          color: '#f59e0b',
                          fontStyle: 'italic',
                        }}
                      >
                        ℹ️ <strong>Note:</strong> {footerNote.replace(/^(?:Note|Warning):\s*/i, '')}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <div className="advisory-footer-row">
          <span>
            Computed for <strong>{station?.stationName || station?.station_name || "Nearest Station"}</strong> (AQI: {advisory.predictedAqi})
          </span>
          <button
            type="button"
            className="details-modal-toggle"
            onClick={() => setShowModal(true)}
          >
            📊 View Action Plan & 35km Avoidance Zones →
          </button>
        </div>
      </section>

      {/* Intuitive Action-Oriented Health Assessment Modal */}
      {showModal && (
        <div className="advisory-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="advisory-modal-panel action-oriented-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowModal(false)}>
              ✕
            </button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: `${riskColor}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  border: `1px solid ${riskColor}40`,
                }}
              >
                🩺
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "22px", fontFamily: "var(--font-heading)", color: "var(--text-main)" }}>
                  Personal Health & Movement Advisor
                </h2>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>
                  Tailored for <strong>{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'your profile'}</strong> • Station AQI {advisory.predictedAqi}
                </p>
              </div>
            </div>

            {/* Top Interactive Tabs */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                borderBottom: "1px solid var(--border)",
                paddingBottom: "12px",
                marginBottom: "20px",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab("verdict")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: activeTab === "verdict" ? "1px solid #0284c7" : "1px solid var(--border)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 700,
                  background: activeTab === "verdict" ? "#0284c7" : "var(--bg-main)",
                  color: activeTab === "verdict" ? "#ffffff" : "var(--text-muted)",
                  transition: "all 0.2s",
                }}
              >
                🚦 Outdoor Verdict &amp; Dos/Don'ts
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("zones")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: activeTab === "zones" ? "1px solid #0284c7" : "1px solid var(--border)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 700,
                  background: activeTab === "zones" ? "#0284c7" : "var(--bg-main)",
                  color: activeTab === "zones" ? "#ffffff" : "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                }}
              >
                📍 35km Hotspot Avoidance
                {highRiskAvoidZones.length > 0 && (
                  <span
                    style={{
                      padding: "1px 6px",
                      borderRadius: "999px",
                      background: activeTab === "zones" ? "rgba(255, 255, 255, 0.25)" : "#ef4444",
                      color: "#fff",
                      fontSize: "10px",
                      fontWeight: 800,
                    }}
                  >
                    {highRiskAvoidZones.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("breakdown")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: activeTab === "breakdown" ? "1px solid #0284c7" : "1px solid var(--border)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 700,
                  background: activeTab === "breakdown" ? "#0284c7" : "var(--bg-main)",
                  color: activeTab === "breakdown" ? "#ffffff" : "var(--text-muted)",
                  transition: "all 0.2s",
                }}
              >
                🔬 Clinical Risk Math
              </button>
            </div>

            {/* TAB 1: VERDICT & DOS/DON'TS */}
            {activeTab === "verdict" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Big Visual Gauge Hero Card */}
                <div
                  style={{
                    padding: "22px",
                    borderRadius: "14px",
                    background: `linear-gradient(135deg, ${riskColor}18, rgba(0,0,0,0.1))`,
                    border: `1.5px solid ${riskColor}50`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "20px",
                  }}
                >
                  <div style={{ flex: "1 1 320px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", background: verdict.badgeBg, color: verdict.color, fontWeight: 800, fontSize: "12px", border: `1px solid ${verdict.color}40`, marginBottom: "8px" }}>
                      <span>{verdict.icon}</span>
                      <span>OUTDOOR STATUS: {verdict.status}</span>
                    </div>
                    <h3 style={{ margin: "4px 0 8px", fontSize: "18px", color: "var(--text-main)" }}>
                      {verdict.headline}
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                      {verdict.subtitle}
                    </p>

                    {/* Visual 5-segment Health Speedometer */}
                    <div style={{ marginTop: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>
                        <span>Optimal</span>
                        <span>Guarded</span>
                        <span>Elevated</span>
                        <span>High</span>
                        <span>Critical</span>
                      </div>
                      <div style={{ height: "10px", borderRadius: "999px", background: "var(--bg-main)", overflow: "hidden", display: "flex", gap: "2px", border: "1px solid var(--border)" }}>
                        <div style={{ flex: 1, background: overallRiskScore <= 20 ? "#16a34a" : "rgba(22, 163, 74, 0.3)" }} />
                        <div style={{ flex: 1, background: overallRiskScore > 20 && overallRiskScore <= 40 ? "#65a30d" : "rgba(101, 163, 13, 0.3)" }} />
                        <div style={{ flex: 1, background: overallRiskScore > 40 && overallRiskScore <= 60 ? "#d97706" : "rgba(217, 119, 6, 0.3)" }} />
                        <div style={{ flex: 1, background: overallRiskScore > 60 && overallRiskScore <= 80 ? "#ea580c" : "rgba(234, 88, 12, 0.3)" }} />
                        <div style={{ flex: 1, background: overallRiskScore > 80 ? "#dc2626" : "rgba(220, 38, 38, 0.3)" }} />
                      </div>
                    </div>
                  </div>

                  {/* Circular Score Badge */}
                  <div
                    style={{
                      width: "108px",
                      height: "108px",
                      borderRadius: "50%",
                      background: "var(--bg-card)",
                      border: `6px solid ${riskColor}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 8px 24px -4px ${riskColor}40`,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: "36px", fontWeight: 900, fontFamily: "var(--font-heading)", color: riskColor, lineHeight: 1 }}>
                      {overallRiskScore}
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", marginTop: "2px" }}>
                      Risk Index
                    </span>
                  </div>
                </div>

                {/* Glanceable Action Plan (DOs & DON'Ts) */}
                <div>
                  <h4 style={{ margin: "0 0 12px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                    📋 Glanceable Action Checklist
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
                    {/* DO THIS Card */}
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        background: "rgba(22, 163, 74, 0.06)",
                        border: "1px solid rgba(22, 163, 74, 0.3)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", fontWeight: 800, fontSize: "13px" }}>
                        <span>✅</span> RECOMMENDED ACTIONS (DO)
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", lineHeight: "1.6", color: "var(--text-main)", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <li><strong>Airway:</strong> {directives.mask.includes("required") || directives.mask.includes("N95") ? directives.mask : "Carry an N95 mask if visiting dense traffic corridors."}</li>
                        <li><strong>Home Care:</strong> {directives.ventilation}</li>
                        <li><strong>Health Protocol:</strong> {directives.medication}</li>
                      </ul>
                    </div>

                    {/* AVOID THIS Card */}
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        background: "rgba(220, 38, 38, 0.06)",
                        border: "1px solid rgba(220, 38, 38, 0.3)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontWeight: 800, fontSize: "13px" }}>
                        <span>🚫</span> WHAT TO AVOID (DON'T)
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", lineHeight: "1.6", color: "var(--text-main)", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <li><strong>Physical Exertion:</strong> {directives.outdoor}</li>
                        <li><strong>High Exposure Windows:</strong> Avoid strenuous outdoor workouts between 6:00 AM - 9:00 AM and 6:00 PM - 9:00 PM during temperature inversion.</li>
                        <li><strong>Sensitive Triggers:</strong> Avoid high-traffic arterial roads and active construction sites within 35 km.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 4 Category Action Directives */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                  <div style={{ padding: "12px 14px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border)", borderLeft: "4px solid #0284c7" }}>
                    <div style={{ fontSize: "11px", fontWeight: 800, color: "#0284c7", textTransform: "uppercase", marginBottom: "4px" }}>🏃 Activity</div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-main)" }}>{directives.outdoor}</div>
                  </div>
                  <div style={{ padding: "12px 14px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border)", borderLeft: "4px solid #10b981" }}>
                    <div style={{ fontSize: "11px", fontWeight: 800, color: "#10b981", textTransform: "uppercase", marginBottom: "4px" }}>😷 Protection</div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-main)" }}>{directives.mask}</div>
                  </div>
                  <div style={{ padding: "12px 14px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border)", borderLeft: "4px solid #f59e0b" }}>
                    <div style={{ fontSize: "11px", fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", marginBottom: "4px" }}>🪟 Windows</div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-main)" }}>{directives.ventilation}</div>
                  </div>
                  <div style={{ padding: "12px 14px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border)", borderLeft: "4px solid #ec4899" }}>
                    <div style={{ fontSize: "11px", fontWeight: 800, color: "#ec4899", textTransform: "uppercase", marginBottom: "4px" }}>💊 Medical</div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-main)" }}>{directives.medication}</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 35 KM RADIUS AVOIDANCE ZONES */}
            {activeTab === "zones" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ background: "var(--bg-main)", padding: "14px 18px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                    🎯 Radial Air Quality Scanner (Within 35 km)
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Calculated relative to <strong>{station?.stationName || station?.station_name || "your location"}</strong>.
                    Areas with high AQI pose an amplified threat to your respiratory profile.
                  </div>
                </div>

                {/* Red Avoid List */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "#ef4444", letterSpacing: "0.05em" }}>
                      🚨 Red Zones: Places to Avoid (AQI &gt; 100)
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {highRiskAvoidZones.length} high-pollution area{highRiskAvoidZones.length === 1 ? "" : "s"} found
                    </span>
                  </div>

                  {highRiskAvoidZones.length === 0 ? (
                    <div style={{ padding: "18px", borderRadius: "8px", background: "rgba(22, 163, 74, 0.08)", border: "1px solid rgba(22, 163, 74, 0.25)", color: "#16a34a", fontSize: "13px", textAlign: "center" }}>
                      ✨ <strong>Great news!</strong> No dangerous pollution hotspots detected within your 35 km radius today.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {highRiskAvoidZones.map((s) => {
                        const bandColor = s.effectiveAqi > 300 ? "#7f1d1d" : s.effectiveAqi > 200 ? "#dc2626" : "#ea580c";
                        return (
                          <div
                            key={s.id}
                            style={{
                              padding: "12px 16px",
                              borderRadius: "8px",
                              background: "var(--bg-main)",
                              border: `1px solid ${bandColor}40`,
                              borderLeft: `5px solid ${bandColor}`,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "12px",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: "200px" }}>
                              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)" }}>
                                {s.stationName || s.station_name}
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                📍 {s.distanceKm < 1 ? `${Math.round(s.distanceKm * 1000)} m` : `${s.distanceKm.toFixed(1)} km`} away
                                {s.city ? ` • ${s.city}` : ""}
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  color: bandColor,
                                  background: `${bandColor}18`,
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                }}
                              >
                                AQI: {s.effectiveAqi}
                              </span>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#ef4444" }}>
                                ⚠️ Avoid Outdoor Visits
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Safe Pockets (Green / Moderate) */}
                {safePockets.length > 0 && (
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "#16a34a", letterSpacing: "0.05em", marginBottom: "10px" }}>
                      🌿 Cleaner Green Pockets (AQI ≤ 100 within 35 km)
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px" }}>
                      {safePockets.slice(0, 4).map((s) => (
                        <div
                          key={s.id}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "8px",
                            background: "var(--bg-main)",
                            border: "1px solid rgba(22, 163, 74, 0.25)",
                            borderLeft: "4px solid #16a34a",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-main)" }}>
                              {s.stationName || s.station_name}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              {s.distanceKm.toFixed(1)} km away
                            </div>
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#16a34a", background: "rgba(22, 163, 74, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                            AQI {s.effectiveAqi}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CLINICAL BREAKDOWN */}
            {activeTab === "breakdown" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  <div style={{ padding: "16px", background: "var(--bg-main)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      🌍 Environmental Base
                    </span>
                    <div style={{ fontSize: "13px", color: "var(--text-main)", marginTop: "4px" }}>
                      Station AQI ({advisory.predictedAqi})
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--primary)", fontFamily: "var(--font-heading)", marginTop: "10px" }}>
                      +{breakdown?.baseAqiContribution ?? 0} <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>pts</span>
                    </div>
                  </div>

                  <div style={{ padding: "16px", background: "var(--bg-main)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      🧬 Clinical Vulnerability
                    </span>
                    <div style={{ fontSize: "12.5px", color: "var(--text-main)", marginTop: "4px" }}>
                      Age: {user?.age || "25"} • {user?.healthConditions?.length > 0 ? user.healthConditions.join(", ") : "Normal Profile"}
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--primary)", fontFamily: "var(--font-heading)", marginTop: "10px" }}>
                      +{breakdown?.vulnerabilityContribution ?? 0} <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>pts</span>
                    </div>
                  </div>

                  <div style={{ padding: "16px", background: "var(--bg-main)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      ⚡ Interaction Factor
                    </span>
                    <div style={{ fontSize: "12.5px", color: "var(--text-main)", marginTop: "4px" }}>
                      Pollution + Health Amplification
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--primary)", fontFamily: "var(--font-heading)", marginTop: "10px" }}>
                      +{breakdown?.amplification ?? "0%"}
                    </div>
                  </div>
                </div>

                <div style={{ padding: "14px 18px", background: "var(--bg-main)", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.6" }}>
                  💡 <strong>How this is computed:</strong> The composite risk index normalizes nearest ambient air pollution against clinical vulnerability coefficients (e.g. respiratory conditions like Asthma or Allergies, age extremes, and smoking status) to provide individualized safety tolerances rather than a one-size-fits-all public warning.
                </div>
              </div>
            )}

            <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="details-modal-toggle"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  padding: "8px 24px",
                  fontSize: "13px",
                  fontWeight: 700,
                  border: "none",
                }}
                onClick={() => setShowModal(false)}
              >
                Close Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
