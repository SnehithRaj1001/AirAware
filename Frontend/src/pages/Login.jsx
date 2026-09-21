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
    // Personalize toggle
    wantPersonalize: false,
    // Profile Fields
    age: "",
    gender: "",
    healthConditions: [],
    smokingStatus: "",
    activityLevel: "",
    symptomSensitivity: "",
    // Initial Symptom Log Fields
    medicationTaken: false,
    symptomsLogged: [],
    symptomSeverities: {},
    outdoorTimeHours: "",
    notes: "",
  });

  const OUTDOOR_TIME_OPTIONS = [
    { label: "< 1 hour", value: 0 },
    { label: "1 - 2 hours", value: 1 },
    { label: "2 - 4 hours", value: 3 },
    { label: "4 - 6 hours", value: 5 },
    { label: "6+ hours", value: 8 },
  ];

  const HEALTH_CONDITION_OPTIONS = [
    "Asthma",
    "COPD",
    "Heart Disease",
    "Diabetes",
    "Allergies",
  ];

  const SYMPTOM_OPTIONS = [
    "Coughing",
    "Shortness of breath",
    "Throat irritation",
    "Eye irritation",
    "Chest tightness",
    "Headache",
    "Fatigue",
  ];

  const SEVERITY_LEVELS = ["Mild", "Moderate", "Severe"];

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleRegisterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegisterForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleHealthConditionToggle = (condition) => {
    setRegisterForm((prev) => {
      let updated = [...prev.healthConditions];
      if (updated.includes(condition)) {
        updated = updated.filter((c) => c !== condition);
      } else {
        updated.push(condition);
      }
      return { ...prev, healthConditions: updated };
    });
  };

  const handleSymptomToggle = (symptom) => {
    setRegisterForm((prev) => {
      let updated = [...prev.symptomsLogged];
      let severities = { ...prev.symptomSeverities };
      if (updated.includes(symptom)) {
        updated = updated.filter((s) => s !== symptom);
        delete severities[symptom];
      } else {
        updated.push(symptom);
        if (!severities[symptom]) {
          severities[symptom] = "Mild";
        }
      }
      return { ...prev, symptomsLogged: updated, symptomSeverities: severities };
    });
  };

  const handleSymptomSeverityChange = (symptom, severity) => {
    setRegisterForm((prev) => ({
      ...prev,
      symptomSeverities: {
        ...prev.symptomSeverities,
        [symptom]: severity,
      },
    }));
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
      setError("Please fill in all required account fields");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        location: registerForm.location,
      };

      if (registerForm.wantPersonalize) {
        payload.age = registerForm.age ? parseInt(registerForm.age, 10) : null;
        payload.gender = registerForm.gender;
        payload.healthConditions = registerForm.healthConditions;
        payload.smokingStatus = registerForm.smokingStatus;
        payload.activityLevel = registerForm.activityLevel;
        payload.symptomSensitivity = registerForm.symptomSensitivity;
        payload.medicationTaken = registerForm.medicationTaken;
        payload.symptomsLogged = registerForm.symptomsLogged;
        payload.symptomSeverity = registerForm.symptomSeverities;
        payload.outdoorTimeHours =
          registerForm.outdoorTimeHours !== ""
            ? parseInt(registerForm.outdoorTimeHours, 10)
            : 0;
        payload.notes = registerForm.notes ? registerForm.notes.trim() : null;
      }

      const response = await authAPI.register(payload);
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
      <div
        className={`auth-card ${
          !isLogin && registerForm.wantPersonalize ? "auth-card-wide" : ""
        }`}
      >
        {error && <div className="error-message">{error}</div>}

        {isLogin ? (
          <form onSubmit={handleLogin} className="auth-form">
            <h1>Login</h1>
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
          <form onSubmit={handleRegister} className="auth-form register-form-enhanced">
            <h1>Create Your Account</h1>
            <p className="subtitle">Set up your health profile and air sensitivity</p>

            {/* Section 1: Account Credentials */}
            <div className="form-section-header">
              <span>1</span> Account Credentials
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-firstName">First Name *</label>
                <input
                  id="register-firstName"
                  type="text"
                  name="firstName"
                  value={registerForm.firstName}
                  onChange={handleRegisterChange}
                  placeholder="e.g. John"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="register-lastName">Last Name *</label>
                <input
                  id="register-lastName"
                  type="text"
                  name="lastName"
                  value={registerForm.lastName}
                  onChange={handleRegisterChange}
                  placeholder="e.g. Doe"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-username">Username *</label>
                <input
                  id="register-username"
                  type="text"
                  name="username"
                  value={registerForm.username}
                  onChange={handleRegisterChange}
                  placeholder="Choose a username"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="register-email">Email Address *</label>
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="register-location">Location / Station Area *</label>
              <input
                id="register-location"
                type="text"
                name="location"
                value={registerForm.location}
                onChange={handleRegisterChange}
                placeholder="e.g., Colaba, Mumbai"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-password">Password *</label>
                <input
                  id="register-password"
                  type="password"
                  name="password"
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  placeholder="Create password"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="register-confirmPassword">Confirm Password *</label>
                <input
                  id="register-confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={registerForm.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>

            {/* Personalization Option Toggle */}
            <div className="personalize-toggle-card">
              <label className="checkbox-label personalize-checkbox-label">
                <input
                  type="checkbox"
                  name="wantPersonalize"
                  checked={registerForm.wantPersonalize}
                  onChange={handleRegisterChange}
                />
                <div className="personalize-text-block">
                  <strong>I want to personalize my dashboard</strong>
                  <span>Provide health and sensitivity details for tailored recommendations</span>
                </div>
              </label>
            </div>

            {registerForm.wantPersonalize && (
              <div className="personalized-sections-wrapper">
                {/* Section 2: Health & Demographics Profile */}
                <div className="form-section-header">
                  <span>2</span> Health & Lifestyle Profile
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="register-age">Age</label>
                    <input
                      id="register-age"
                      type="number"
                      name="age"
                      min="1"
                      max="120"
                      value={registerForm.age}
                      onChange={handleRegisterChange}
                      placeholder="e.g. 28"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="register-gender">Gender</label>
                    <select
                      id="register-gender"
                      name="gender"
                      value={registerForm.gender}
                      onChange={handleRegisterChange}
                    >
                      <option value="">---- Select an option ----</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Health Conditions</label>
                  <div className="chips-container">
                    {HEALTH_CONDITION_OPTIONS.map((cond) => {
                      const isSelected = registerForm.healthConditions.includes(cond);
                      return (
                        <button
                          key={cond}
                          type="button"
                          className={`chip-button ${isSelected ? "chip-active" : ""}`}
                          onClick={() => handleHealthConditionToggle(cond)}
                        >
                          {isSelected ? "✓ " : "+ "}{cond}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="register-smoking">Smoking Status</label>
                    <select
                      id="register-smoking"
                      name="smokingStatus"
                      value={registerForm.smokingStatus}
                      onChange={handleRegisterChange}
                    >
                      <option value="">---- Select an option ----</option>
                      <option value="Non-smoker">Non-smoker</option>
                      <option value="Former smoker">Former smoker</option>
                      <option value="Occasional smoker">Occasional smoker</option>
                      <option value="Regular smoker">Regular smoker</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="register-sensitivity">Air Pollution Sensitivity</label>
                    <select
                      id="register-sensitivity"
                      name="symptomSensitivity"
                      value={registerForm.symptomSensitivity}
                      onChange={handleRegisterChange}
                    >
                      <option value="">---- Select an option ----</option>
                      <option value="Low">Low (Rarely affected)</option>
                      <option value="Moderate">Moderate (Mildly affected on bad days)</option>
                      <option value="High">High (Noticeable symptoms on polluted days)</option>
                      <option value="Extreme">Extreme (Severe reactions requiring intervention)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="register-activity">Daily Activity Level</label>
                  <select
                    id="register-activity"
                    name="activityLevel"
                    value={registerForm.activityLevel}
                    onChange={handleRegisterChange}
                  >
                    <option value="">---- Select an option ----</option>
                    <option value="Sedentary">Sedentary (Little or no exercise)</option>
                    <option value="Lightly Active">Lightly Active (Light exercise 1-3 days/wk)</option>
                    <option value="Moderately Active">Moderately Active (Moderate exercise 3-5 days/wk)</option>
                    <option value="Very Active">Very Active (Heavy exercise 6-7 days/wk)</option>
                  </select>
                </div>

                {/* Section 3: Baseline / Current Symptom Status */}
                <div className="form-section-header">
                  <span>3</span> Initial Symptom & Activity Log
                </div>

                <div className="form-group">
                  <label>Current Symptoms (if any)</label>
                  <div className="chips-container">
                    {SYMPTOM_OPTIONS.map((sym) => {
                      const isSelected = registerForm.symptomsLogged.includes(sym);
                      return (
                        <button
                          key={sym}
                          type="button"
                          className={`chip-button ${isSelected ? "chip-active" : ""}`}
                          onClick={() => handleSymptomToggle(sym)}
                        >
                          {isSelected ? "✓ " : "+ "}{sym}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Per-Symptom Severity Selector */}
                {registerForm.symptomsLogged.length > 0 && (
                  <div className="per-symptom-severity-box">
                    <label className="section-sublabel">Specify Severity for Selected Symptoms</label>
                    <div className="symptom-severity-list">
                      {registerForm.symptomsLogged.map((symptom) => (
                        <div key={symptom} className="symptom-severity-row">
                          <span className="symptom-row-name">{symptom}</span>
                          <div className="severity-pill-group">
                            {SEVERITY_LEVELS.map((level) => {
                              const isCurrent =
                                (registerForm.symptomSeverities[symptom] || "Mild") === level;
                              return (
                                <button
                                  key={level}
                                  type="button"
                                  className={`severity-pill ${isCurrent ? `severity-${level.toLowerCase()}-active` : ""}`}
                                  onClick={() => handleSymptomSeverityChange(symptom, level)}
                                >
                                  {level}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="register-outdoor">Daily Outdoor Time</label>
                  <select
                    id="register-outdoor"
                    name="outdoorTimeHours"
                    value={registerForm.outdoorTimeHours}
                    onChange={handleRegisterChange}
                  >
                    <option value="">---- Select an option ----</option>
                    {OUTDOOR_TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="medicationTaken"
                      checked={registerForm.medicationTaken}
                      onChange={handleRegisterChange}
                    />
                    <span>Currently taking respiratory or allergy medication</span>
                  </label>
                </div>

                <div className="form-group" style={{ marginTop: "16px" }}>
                  <label htmlFor="register-notes">Prescription / Additional Notes</label>
                  <textarea
                    id="register-notes"
                    name="notes"
                    rows="3"
                    value={registerForm.notes}
                    onChange={handleRegisterChange}
                    placeholder="e.g., Inhaler prescribed for high AQI days, doctor instructions, known triggers..."
                  />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Creating Account..." : "Complete Registration"}
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
