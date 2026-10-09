import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { publicAPI } from "../api.js";
import StationCard from "../components/StationCard.jsx";
import { DashboardSkeleton } from "../components/Skeleton.jsx";
import "./Dashboard.css";

const STATIONS_PER_PAGE = 20;

const Dashboard = () => {
  const [stations, setStations] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [sortOption, setSortOption] = useState("distance");
  const [maxDistance, setMaxDistance] = useState("all");
  const [userCoords, setUserCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState("prompt"); // 'prompt' | 'granted' | 'denied'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Haversine distance in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
          setGeoStatus("granted");
        },
        () => {
          setGeoStatus("denied");
          setSortOption("name");
        },
        { timeout: 8000 }
      );
    }
  }, []);

  useEffect(() => {
    const loadStations = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.getAllStations();
        setStations(response.data);
        setCurrentPage(1);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, []);

  const filteredStations = useMemo(() => {
    const normalized = searchText.trim().toLowerCase();

    // Map stations with computed distance
    let list = stations.map((station) => {
      const dist =
        userCoords && station.latitude != null && station.longitude != null
          ? calculateDistance(
              userCoords.latitude,
              userCoords.longitude,
              station.latitude,
              station.longitude
            )
          : null;
      return { ...station, distanceKm: dist };
    });

    if (normalized) {
      list = list.filter((item) =>
        item.stationName.toLowerCase().includes(normalized) ||
        (item.address && item.address.toLowerCase().includes(normalized))
      );
    }

    // Distance range filter
    if (maxDistance !== "all" && userCoords) {
      const maxKm = Number(maxDistance);
      list = list.filter((item) => item.distanceKm != null && item.distanceKm <= maxKm);
    }

    if (sortOption === "distance") {
      list = [...list].sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sortOption === "pm25") {
      list = [...list].sort(
        (a, b) => (b.latestAqi?.pm25 ?? 0) - (a.latestAqi?.pm25 ?? 0)
      );
    } else {
      list = [...list].sort((a, b) =>
        a.stationName.localeCompare(b.stationName)
      );
    }

    return list;
  }, [stations, searchText, sortOption, maxDistance, userCoords]);

  // Pagination logic
  const totalPages = Math.ceil(filteredStations.length / STATIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * STATIONS_PER_PAGE;
  const endIndex = startIndex + STATIONS_PER_PAGE;
  const currentStations = filteredStations.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <h1>Air Quality Monitoring Stations</h1>
          <div className="hero-subtitle-row">
            <p>Monitor real-time air quality observations across all Maharashtra stations.</p>

            {userCoords && (
              <span className="location-pill live-gps-pill">
                📍 GPS Distance Active
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="controls-row">
        <div className="control-block">
          <label htmlFor="search">Search stations</label>
          <input
            id="search"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by station or city"
          />
        </div>

        <div className="control-block">
          <label htmlFor="sort">Sort by</label>
          <select
            id="sort"
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              setCurrentPage(1);
            }}
          >
            {userCoords && <option value="distance">📍 Distance (Nearest First)</option>}
            <option value="name">Name (A-Z)</option>
            <option value="pm25">Highest PM2.5</option>
          </select>
        </div>

        {userCoords && (
          <div className="control-block">
            <label htmlFor="dist-filter">Within Distance</label>
            <select
              id="dist-filter"
              value={maxDistance}
              onChange={(e) => {
                setMaxDistance(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Distances</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
              <option value="200">Within 200 km</option>
            </select>
          </div>
        )}

        <Link to="/map" className="secondary-button" style={{ alignSelf: 'flex-end', height: '44px', display: 'inline-flex', alignItems: 'center' }}>
          Interactive Map
        </Link>
      </section>

      {error ? <div className="error-box">{error}</div> : null}

      {filteredStations.length === 0 ? (
        <div className="no-results">
          <p>No stations found matching your search.</p>
        </div>
      ) : (
        <>
          <section className="stations-grid">
            {currentStations.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </section>

          {/* Pagination Controls */}
          <section className="pagination-section">
            <div className="pagination-info">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredStations.length)} of {filteredStations.length} stations
            </div>

            <div className="pagination-controls">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>

              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => {
                  const page = i + 1;
                  // Show current page and adjacent pages
                  const isNear =
                    Math.abs(page - currentPage) <= 1 ||
                    page === 1 ||
                    page === totalPages;

                  if (!isNear && page !== 2 && page !== totalPages - 1) {
                    return null;
                  }

                  if (page === 2 && currentPage > 3) {
                    return (
                      <span key="ellipsis-start" className="pagination-ellipsis">
                        ...
                      </span>
                    );
                  }

                  if (page === totalPages - 1 && currentPage < totalPages - 2) {
                    return (
                      <span key="ellipsis-end" className="pagination-ellipsis">
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`pagination-number ${
                        currentPage === page ? "active" : ""
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default Dashboard;
