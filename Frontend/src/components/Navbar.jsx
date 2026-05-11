import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("authToken");

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-section">
          <h1>AirAware</h1>
          <p>Real-time air quality monitoring with station insights.</p>
        </div>
        <nav className="app-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
            Stations
          </NavLink>

          {token && user ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                My Dashboard
              </NavLink>
              <NavLink to="/trends" className={({ isActive }) => isActive ? "active" : ""}>
                Trends
              </NavLink>
              <div className="user-section">
                <span className="user-name">
                  {user.firstName} {user.lastName}
                </span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <NavLink to="/login" className={({ isActive }) => isActive ? "active" : ""}>
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
