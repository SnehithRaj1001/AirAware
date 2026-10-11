import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (username, password) =>
    apiClient.post("/auth/login", { username, password }),
  register: (payload, lastName, username, email, password, location) => {
    // If passed as an object payload
    if (typeof payload === "object" && payload !== null) {
      return apiClient.post("/auth/register", payload);
    }
    // Backward compatibility if called with positional arguments
    return apiClient.post("/auth/register", {
      firstName: payload,
      lastName,
      username,
      email,
      password,
      location,
    });
  },
  getProfile: () => apiClient.get("/auth/profile"),
  updateProfile: (profileData) => apiClient.put("/auth/profile", profileData),
};

// User APIs (authenticated)
export const userAPI = {
  getDashboard: () => apiClient.get("/user/dashboard"),
  getAdvisory: (stationId) => apiClient.get("/user/advisory", { params: stationId ? { stationId } : {} }),
  getTrends: () => apiClient.get("/user/trends"),
};


// Public APIs
export const publicAPI = {
  getNews: () => apiClient.get("/api/news"),
  getMapConfig: () => apiClient.get("/api/map/config"),
  getAllStations: () => apiClient.get("/api/map/stations"),
  getStation: (stationId) => apiClient.get(`/api/map/stations/${stationId}`),
};

// Real-Time AQI (IoT Raspi sensor) APIs
export const rtaqiAPI = {
  getLatest: (deviceId) =>
    apiClient.get("/api/rtaqi/latest", { params: deviceId ? { deviceId } : {} }),
  getHistory: (deviceId, limit = 60) =>
    apiClient.get("/api/rtaqi/history", { params: { ...(deviceId ? { deviceId } : {}), limit } }),
};

// Legacy endpoints (kept for compatibility)
export const fetchStations = async () => {
  return (await apiClient.get("/stations")).data;
};

export const fetchStationDetails = async (stationId) => {
  return (await apiClient.get(`/stations/${stationId}`)).data;
};

export const fetchLatestAqi = async (stationId) => {
  return (await apiClient.get(`/aqi/${stationId}`)).data;
};

export const fetchAqiHistory = async (stationId) => {
  return (await apiClient.get(`/aqi/history/${stationId}`)).data;
};

export const fetchAqiTrends = async (stationId) => {
  return (await apiClient.get(`/aqi/trends/${stationId}`)).data;
};

export const fetchStationForecast = async (stationId) => {
  return (await apiClient.get(`/stations/${stationId}/forecast`)).data;
};

export const fetchDashboardSummary = async () => {
  return (await apiClient.get("/dashboard/summary")).data;
};

export const fetchStationComparison = async (stationIds, days = 30) => {
  const idsStr = Array.isArray(stationIds) ? stationIds.join(",") : stationIds;
  return (await apiClient.get("/aqi/compare/stations", { params: { ids: idsStr, days } })).data;
};

export const fetchCityComparison = async (cities, days = 30) => {
  const citiesStr = Array.isArray(cities) ? cities.join(",") : cities;
  return (await apiClient.get("/aqi/compare/cities", { params: { cities: citiesStr, days } })).data;
};


export default apiClient;
