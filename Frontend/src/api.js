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
  register: (firstName, lastName, username, email, password, location) =>
    apiClient.post("/auth/register", {
      firstName,
      lastName,
      username,
      email,
      password,
      location,
    }),
  getProfile: () => apiClient.get("/auth/profile"),
};

// User APIs (authenticated)
export const userAPI = {
  getDashboard: () => apiClient.get("/user/dashboard"),
  getTrends: () => apiClient.get("/user/trends"),
};

// Public APIs
export const publicAPI = {
  getNews: () => apiClient.get("/api/news"),
  getAllStations: () => apiClient.get("/api/map/stations"),
  getStation: (stationId) => apiClient.get(`/api/map/stations/${stationId}`),
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

export const fetchDashboardSummary = async () => {
  return (await apiClient.get("/dashboard/summary")).data;
};

export default apiClient;
