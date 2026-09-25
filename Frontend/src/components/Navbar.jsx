import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("authToken");
  const [menuOpen, setMenuOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || 
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

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
                <button
                  type="button"
                  className="theme-toggle-btn"
                  onClick={toggleTheme}
                  title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                  aria-label="Toggle dark mode"
                >
                  {theme === "dark" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                  )}
                </button>
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
            <div className="guest-section" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={toggleTheme}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                aria-label="Toggle dark mode"
              >
                {theme === "dark" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                )}
              </button>
              <NavLink to="/login" className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
                Login
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
