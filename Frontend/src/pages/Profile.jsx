import { useState, useEffect } from "react";
import { authAPI } from "../api";
import "./Profile.css";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    location: "",
    age: "",
    gender: "Prefer not to say",
    healthConditions: [],
    smokingStatus: "Non-smoker",
    activityLevel: "Moderately Active",
    symptomSensitivity: "Moderate",
    notes: "",
    symptomLogs: [],
  });

  const HEALTH_CONDITION_OPTIONS = [
    "Asthma",
    "COPD",
    "Heart Disease",
    "Diabetes",
    "Allergies",
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await authAPI.getProfile();
      const u = res.data;

      setProfileData({
        firstName: u.first_name || "",
        lastName: u.last_name || "",
        username: u.username || "",
        email: u.email || "",
        location: u.location || "",
        age: u.age != null ? u.age : "",
        gender: u.gender || "",
        healthConditions: Array.isArray(u.health_conditions) ? u.health_conditions : [],
        smokingStatus: u.smoking_status || "",
        activityLevel: u.activity_level || "",
        symptomSensitivity: u.symptom_sensitivity || "",
        notes: u.notes || "",
        symptomLogs: u.symptomLogs || [],
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    setSuccessMsg("");
    setError("");
  };

  const handleHealthConditionToggle = (condition) => {
    setProfileData((prev) => {
      let updated = [...prev.healthConditions];
      if (updated.includes(condition)) {
        updated = updated.filter((c) => c !== condition);
      } else {
        updated.push(condition);
      }
      return { ...prev, healthConditions: updated };
    });
    setSuccessMsg("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await authAPI.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        location: profileData.location,
        age: profileData.age ? parseInt(profileData.age, 10) : null,
        gender: profileData.gender,
        healthConditions: profileData.healthConditions,
        smokingStatus: profileData.smokingStatus,
        activityLevel: profileData.activityLevel,
        symptomSensitivity: profileData.symptomSensitivity,
        notes: profileData.notes,
      });

      // Update cached user object in localStorage
      const cached = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...cached,
          firstName: res.data.first_name,
          lastName: res.data.last_name,
          email: res.data.email,
          location: res.data.location,
          age: res.data.age,
          gender: res.data.gender,
          healthConditions: res.data.health_conditions,
          smokingStatus: res.data.smoking_status,
          activityLevel: res.data.activity_level,
          symptomSensitivity: res.data.symptom_sensitivity,
          notes: res.data.notes,
        })
      );

      setSuccessMsg("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-shell">
      <div className="profile-container">
        {/* Profile Header Card */}
        <div className="profile-hero-card">
          <div className="profile-avatar-badge">
            {profileData.firstName ? profileData.firstName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="profile-hero-details">
            <h2>{profileData.firstName} {profileData.lastName}</h2>
            <span className="profile-username">@{profileData.username}</span>
            <div className="profile-hero-tags">
              <span className="hero-pill location-pill">📍 {profileData.location || "No location set"}</span>
              <span className="hero-pill sensitivity-pill">⚡ Sensitivity: {profileData.symptomSensitivity}</span>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMsg && <div className="success-banner">{successMsg}</div>}

        <form onSubmit={handleSave} className="profile-form">
          {/* Account Details Section */}
          <div className="profile-section-card">
            <div className="section-title-wrap">
              <h3>Account Credentials</h3>
              <p>Your identity and default air monitoring station</p>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prof-firstName">First Name</label>
                <input
                  id="prof-firstName"
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="prof-lastName">Last Name</label>
                <input
                  id="prof-lastName"
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prof-username">Username</label>
                <input
                  id="prof-username"
                  type="text"
                  name="username"
                  value={profileData.username}
                  disabled
                  className="input-disabled"
                />
              </div>
              <div className="form-group">
                <label htmlFor="prof-email">Email Address</label>
                <input
                  id="prof-email"
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prof-location">Monitoring Location / Station Area</label>
              <input
                id="prof-location"
                type="text"
                name="location"
                value={profileData.location}
                onChange={handleChange}
                placeholder="e.g. Colaba, Mumbai"
                required
              />
            </div>
          </div>

          {/* Health & Personal Attributes */}
          <div className="profile-section-card">
            <div className="section-title-wrap">
              <h3>Health & Lifestyle Personalization</h3>
              <p>Fine-tune environmental sensitivity and health tracking parameters</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prof-age">Age</label>
                <input
                  id="prof-age"
                  type="number"
                  name="age"
                  min="1"
                  max="120"
                  value={profileData.age}
                  onChange={handleChange}
                  placeholder="e.g. 28"
                />
              </div>
              <div className="form-group">
                <label htmlFor="prof-gender">Gender</label>
                <select
                  id="prof-gender"
                  name="gender"
                  value={profileData.gender}
                  onChange={handleChange}
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
              <label>Pre-existing Health Conditions</label>
              <div className="chips-container">
                {HEALTH_CONDITION_OPTIONS.map((cond) => {
                  const isSelected = profileData.healthConditions.includes(cond);
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
                <label htmlFor="prof-smoking">Smoking Status</label>
                <select
                  id="prof-smoking"
                  name="smokingStatus"
                  value={profileData.smokingStatus}
                  onChange={handleChange}
                >
                  <option value="">---- Select an option ----</option>
                  <option value="Non-smoker">Non-smoker</option>
                  <option value="Former smoker">Former smoker</option>
                  <option value="Occasional smoker">Occasional smoker</option>
                  <option value="Regular smoker">Regular smoker</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="prof-sensitivity">Air Pollution Sensitivity</label>
                <select
                  id="prof-sensitivity"
                  name="symptomSensitivity"
                  value={profileData.symptomSensitivity}
                  onChange={handleChange}
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
              <label htmlFor="prof-activity">Daily Activity Level</label>
              <select
                id="prof-activity"
                name="activityLevel"
                value={profileData.activityLevel}
                onChange={handleChange}
              >
                <option value="">---- Select an option ----</option>
                <option value="Sedentary">Sedentary (Little or no exercise)</option>
                <option value="Lightly Active">Lightly Active (Light exercise 1-3 days/wk)</option>
                <option value="Moderately Active">Moderately Active (Moderate exercise 3-5 days/wk)</option>
                <option value="Very Active">Very Active (Heavy exercise 6-7 days/wk)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="prof-notes">Prescription / Additional Notes</label>
              <textarea
                id="prof-notes"
                name="notes"
                rows="3"
                value={profileData.notes}
                onChange={handleChange}
                placeholder="e.g., Inhaler prescribed for high AQI days, doctor instructions, known triggers..."
              />
            </div>

            <div className="profile-actions-bar">
              <button type="submit" disabled={saving} className="btn-save-profile">
                {saving ? "Saving Changes..." : "Save Profile"}
              </button>
            </div>
          </div>
        </form>

        {/* Recent Symptom Check-ins Card */}
        {profileData.symptomLogs && profileData.symptomLogs.length > 0 && (
          <div className="profile-section-card logs-card">
            <div className="section-title-wrap">
              <h3>Recent Symptom Logs</h3>
              <p>Historical check-ins recorded for your profile</p>
            </div>

            <div className="recent-logs-list">
              {profileData.symptomLogs.map((log) => {
                let parsedSeverity = null;
                try {
                  parsedSeverity =
                    typeof log.symptom_severity === "string" &&
                    log.symptom_severity.startsWith("{")
                      ? JSON.parse(log.symptom_severity)
                      : log.symptom_severity;
                } catch {
                  parsedSeverity = log.symptom_severity;
                }

                return (
                  <div key={log.id} className="log-history-item">
                    <div className="log-top-row">
                      <span className="log-date">
                        📅 {new Date(log.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {log.medication_taken && (
                        <span className="medication-badge">💊 Medication Taken</span>
                      )}
                    </div>

                    <div className="log-details-grid">
                      <div className="log-col">
                        <span className="log-label">Outdoor Exposure</span>
                        <strong>{log.outdoor_time_hours != null ? `${log.outdoor_time_hours} hrs/day` : "N/A"}</strong>
                      </div>
                      <div className="log-col log-col-symptoms">
                        <span className="log-label">Symptoms & Severity</span>
                        {log.symptoms_logged && log.symptoms_logged.length > 0 ? (
                          <div className="logged-symptoms-chips">
                            {log.symptoms_logged.map((sym) => {
                              const sev =
                                typeof parsedSeverity === "object" && parsedSeverity !== null
                                  ? parsedSeverity[sym] || "Mild"
                                  : parsedSeverity || "Mild";
                              return (
                                <span key={sym} className={`history-sym-chip sev-${sev.toLowerCase()}`}>
                                  {sym}: <strong>{sev}</strong>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <em>No symptoms reported</em>
                        )}
                      </div>
                    </div>

                    {log.notes && (
                      <div className="log-notes-snippet">
                        <span className="log-label">Notes & Instructions:</span>
                        <p>{log.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
