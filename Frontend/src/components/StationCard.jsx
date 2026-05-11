import { Link } from "react-router-dom";
import "./StationCard.css";

const getLevelClass = (pm25) => {
  if (pm25 == null) return "level-unknown";
  if (pm25 <= 12) return "level-good";
  if (pm25 <= 35.4) return "level-moderate";
  if (pm25 <= 55.4) return "level-unhealthy-sensitive";
  if (pm25 <= 150.4) return "level-unhealthy";
  return "level-very-unhealthy";
};

const StationCard = ({ station }) => {
  // Handle both old and new API formats
  const stationName = station.stationName || station.station_name;
  const latestAqi = station.latestAqi || station.latest || {};
  const stationId = station.id || station.station_id;
  
  const cardClass = getLevelClass(latestAqi.pm25);

  return (
    <article className={`station-card ${cardClass}`}>
      <div className="station-card__header">
        <h3>{stationName}</h3>
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
      <div className="station-card__footer">
        <Link to={`/station/${stationId}`} className="details-link">
          View details
        </Link>
      </div>
    </article>
  );
};

export default StationCard;
