import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../api";
import "./Login.css";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "",
  });

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(
        loginForm.username,
        loginForm.password,
      );
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (
      !registerForm.firstName ||
      !registerForm.lastName ||
      !registerForm.username ||
      !registerForm.email ||
      !registerForm.password ||
      !registerForm.confirmPassword ||
      !registerForm.location
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register(
        registerForm.firstName,
        registerForm.lastName,
        registerForm.username,
        registerForm.email,
        registerForm.password,
        registerForm.location,
      );
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>AirAware</h1>
        <p className="subtitle">Real-time Air Quality Monitoring</p>

        {error && <div className="error-message">{error}</div>}

        {isLogin ? (
          <form onSubmit={handleLogin} className="auth-form">
            <h2>Login</h2>
            <div className="form-group">
              <label htmlFor="login-username">Username</label>
              <input
                id="login-username"
                type="text"
                name="username"
                value={loginForm.username}
                onChange={handleLoginChange}
                placeholder="Enter your username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Logging in..." : "Login"}
            </button>
            <p className="toggle-text">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                }}
                className="toggle-btn"
              >
                Register
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-form">
            <h2>Register</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-firstName">First Name</label>
                <input
                  id="register-firstName"
                  type="text"
                  name="firstName"
                  value={registerForm.firstName}
                  onChange={handleRegisterChange}
                  placeholder="First name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="register-lastName">Last Name</label>
                <input
                  id="register-lastName"
                  type="text"
                  name="lastName"
                  value={registerForm.lastName}
                  onChange={handleRegisterChange}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="register-username">Username</label>
              <input
                id="register-username"
                type="text"
                name="username"
                value={registerForm.username}
                onChange={handleRegisterChange}
                placeholder="Choose a username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                name="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="register-location">Location</label>
              <input
                id="register-location"
                type="text"
                name="location"
                value={registerForm.location}
                onChange={handleRegisterChange}
                placeholder="e.g., Colaba, Mumbai"
              />
            </div>
            <div className="form-group">
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                name="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                placeholder="Create a password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="register-confirmPassword">Confirm Password</label>
              <input
                id="register-confirmPassword"
                type="password"
                name="confirmPassword"
                value={registerForm.confirmPassword}
                onChange={handleRegisterChange}
                placeholder="Confirm password"
              />
            </div>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Registering..." : "Register"}
            </button>
            <p className="toggle-text">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                }}
                className="toggle-btn"
              >
                Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
