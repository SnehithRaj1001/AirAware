import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { publicAPI } from "../api.js";
import StationCard from "../components/StationCard.jsx";
import "./Dashboard.css";

const STATIONS_PER_PAGE = 20;

const Dashboard = () => {
  const [stations, setStations] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [sortOption, setSortOption] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

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
    let list = stations;

    if (normalized) {
      list = list.filter((item) =>
        item.stationName.toLowerCase().includes(normalized),
      );
    }

    if (sortOption === "pm25") {
      list = [...list].sort(
        (a, b) => (b.latestAqi?.pm25 ?? 0) - (a.latestAqi?.pm25 ?? 0),
      );
    } else {
      list = [...list].sort((a, b) =>
        a.stationName.localeCompare(b.stationName),
      );
    }

    return list;
  }, [stations, searchText, sortOption]);

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
    return (
      <main className="page-shell">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading stations...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <h1>AirAware Dashboard</h1>
          <p>
            Monitor real-time air quality and pollution trends across stations.
          </p>
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
            placeholder="Filter by name"
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
            <option value="name">Name</option>
            <option value="pm25">PM2.5</option>
          </select>
        </div>

        <Link to="/trends" className="secondary-button">
          View trends
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
