import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("authToken");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setMenuOpen(false);
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-section">
          <h1>AirAware</h1>
          <p className="logo-subtitle">Real-time air quality monitoring with station insights.</p>
        </div>

        {/* Hamburger Button (mobile only) */}
        <button
          className={`hamburger-btn ${menuOpen ? "hamburger-open" : ""}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Backdrop */}
        {menuOpen && <div className="nav-backdrop" onClick={closeMenu}></div>}

        {/* Navigation */}
        <nav className={`app-nav ${menuOpen ? "nav-open" : ""}`}>
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
            Stations
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
            Map View
          </NavLink>

          {token && user ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
                My Dashboard
              </NavLink>
              <NavLink to="/trends" className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
                Trends
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
                My Profile
              </NavLink>
              <div className="user-section">
                <NavLink to="/profile" className="user-name-link" onClick={closeMenu}>
                  <span className="user-name">
                    {user.firstName} {user.lastName}
                  </span>
                </NavLink>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <NavLink to="/login" className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
