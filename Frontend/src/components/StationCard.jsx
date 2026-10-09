import { Link } from "react-router-dom";
import { getIndianAqiBand } from "../utils/aqiStandards.js";
import "./StationCard.css";

const StationCard = ({ station }) => {
  // Handle both old and new API formats
  const stationName = station.stationName || station.station_name;
  const latestAqi = station.latestAqi || station.latest || {};
  const stationId = station.id || station.station_id;
  
  // Calculate AQI (PM2.5 or max recorded pollutant)
  const aqiVal = latestAqi.aqi != null 
    ? latestAqi.aqi 
    : (latestAqi.pm25 != null ? latestAqi.pm25 : null);
  const band = getIndianAqiBand(aqiVal);
  const cardClass = band.className;


  return (
    <article className={`station-card ${cardClass}`}>
      <div className="station-card__header">
        <div className="station-card__title-row">
          <h3>{stationName}</h3>
          {station.distanceKm != null && (
            <span className="station-card__dist-chip">
              {station.distanceKm < 1
                ? `${Math.round(station.distanceKm * 1000)} m away`
                : `${station.distanceKm.toFixed(1)} km away`}
            </span>
          )}
        </div>
        <span>
          {latestAqi.date ? new Date(latestAqi.date).toLocaleString() : "No data"}
        </span>
      </div>
      <div className="station-card__metrics">
        <div>
          <strong>PM2.5</strong>
          <span>{latestAqi.pm25 ?? "--"}</span>
        </div>
        <div>
          <strong>PM10</strong>
          <span>{latestAqi.pm10 ?? "--"}</span>
        </div>
      </div>
      <div className="station-card__footer" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Link to={`/station/${stationId}`} className="details-link" style={{ flex: 1, textAlign: 'center' }}>
          View details
        </Link>
        <Link
          to={`/compare?mode=station&stationIds=${stationId}`}
          className="details-link"
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            padding: '8px 12px',
            fontSize: '12px'
          }}
          title="Compare this station"
        >
          ⚖️ Compare
        </Link>
      </div>
    </article>

  );
};

export default StationCard;
