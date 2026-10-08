# AirAware - Air Quality Monitoring & Forecasting Platform

A full-stack web application for monitoring, analyzing, and forecasting air quality across 88 stations in Maharashtra, India. Features continuous geospatial heatmaps, ML forecasting via XGBoost, live IoT sensor integration, and real-time distance-based station ranking.

---

## ✨ Features

- **Interactive Fluid Heatmap (`MapView`)**:
  - Continuous geospatial density heatmap powered by `leaflet.heat` displaying smooth AQI pollutant gradients across Maharashtra.
  - Native theme toggle (Dark / Light mode) with high-contrast, watermark-free cartography filters.
  - Dynamic display controls to toggle between continuous heat clouds and individual station pin markers.
- **Location-Aware Distance Ranking & Proximity Filter**:
  - Live browser GPS detection (with graceful fallback to user-configured home station coordinates).
  - Stations ranked in real-time by geographical proximity using the Haversine formula (`#1`, `#2`, etc.).
  - Distance radius filtering (`Within 10km`, `25km`, `50km`, `100km`, `200km`) on the station explorer.
  - Dynamic `🎯 Nearest Station` card featured on the user dashboard.
- **Cascading Trends Explorer & Deep-Linking**:
  - Two-tier **City → Station** cascading dropdown selectors across all 88 monitoring stations.
  - Deep-link support (`/station/:id` → `/trends?stationId=:id`) automatically pre-selecting the correct city and station.
- **Machine Learning & Time-Series Forecasting**:
  - Station-specific XGBoost models predicting 3, 7, and 14-day forecasts for individual pollutants (PM2.5, PM10, NO2, SO2, CO, Ozone).
  - Server-Sent Events (SSE) live streaming during on-demand model retraining from the UI.
- **IoT Hardware Sensor Telemetry (RTAQI)**:
  - Ingests live telemetry from edge sensors (e.g. Raspberry Pi / ESP32) stored in Supabase with sub-minute sync.
- **User Health Journal & Advisory**:
  - Personalized profile tracking respiratory vulnerability, age, and a daily symptom diary with severity scoring.
- **Modern UI & Shimmer Skeletons**:
  - Polished responsive design system with shimmer skeleton loaders replacing jarring spinner states across all views.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React-Leaflet, Leaflet.heat, Recharts, Axios, Lucide React |
| **Backend** | Node.js, Express.js (ES Modules), PostgreSQL (`pg`), JSON Web Tokens (JWT) |
| **Database** | Supabase PostgreSQL (Connection Pooler with SSL) |
| **Machine Learning** | Python 3.12, XGBoost, Scikit-learn, Pandas, Joblib |
| **ETL & Data Pipeline** | Python, Selenium, CPCB Official Portal Scraper |

---

## 📁 Project Structure

```
AirAware/
├── Backend/                    # Express.js REST API
│   ├── controllers/            # Route handlers (auth, stations, aqi, user, public, rtaqi)
│   ├── routes/                 # Express routing declarations
│   ├── services/               # Business logic & ML training execution
│   ├── repositories/           # PostgreSQL queries (optimized LATERAL JOINs)
│   ├── db.js                   # Supabase Pooler client (ESM dotenv-hoisted)
│   └── server.js               # Application entry point
├── Frontend/                   # React 19 + Vite client application
│   ├── src/
│   │   ├── components/         # Navbar, StationCard, Skeleton, PollutantChart, etc.
│   │   ├── pages/              # PublicDashboard, UserDashboard, MapView, Trends, etc.
│   │   └── api.js              # Centralized Axios HTTP client
│   └── index.html
├── DATASET/                    # Data ingestion & ETL pipeline
│   ├── 1-fetchStationNames.py  # Scrapes station names from CPCB
│   ├── 2-downloadFiles.py      # Downloads historical records
│   ├── 3-updater.py            # Selenium scraper for incremental CPCB updates
│   ├── 4-mergeFiles.py         # Merges years, interpolates, and generates lag features
│   ├── 5-pushToDB.py           # Bulk loads processed dataset to Supabase PostgreSQL
│   ├── init_db.py              # Schema generator from db.sql
│   └── init_stations.py        # Seeds 88 Maharashtra monitoring stations
├── models/                     # Trained XGBoost model binaries (.pkl)
├── db.sql                      # Complete PostgreSQL schema definition
├── Model-XGBoost.py            # Standalone XGBoost training script
├── requirements.txt            # Python dependencies
└── .env.example                # Root environment variables template
```

---

## ⚙️ Environment Configuration

AirAware requires environment variables configured for the backend, database connection, and frontend client.

### 1. Root & Backend Configuration (`.env` and `Backend/.env`)

Create `.env` in the root folder and in `Backend/.env` (or copy from [`.env.example`](file:///i:/.College%20stuff/Sem%202/MAJOR%20PROJECT/AirAware/.env.example)):

```env
# ==========================================
# Server Configuration
# ==========================================
PORT=4000
NODE_ENV=development

# ==========================================
# Authentication
# ==========================================
JWT_SECRET=your_secure_random_32_character_secret_key_here
JWT_EXPIRY=7d

# ==========================================
# Database Connection (Supabase PostgreSQL)
# ==========================================
# Note: Use Supabase Connection Pooler URL (Transaction or Session mode)
DATABASE_URL=postgresql://postgres.your-project-ref:your-db-password@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres

# ==========================================
# Supabase REST / IoT Sensor Service (Optional)
# ==========================================
# Found in: Supabase Dashboard -> Project Settings -> API
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-or-anon-key
SUPABASE_TABLE=sensor_readings

# ==========================================
# Map Configuration (Optional)
# ==========================================
CARTO_API_KEY=your_carto_api_key_here
```

### 2. Frontend Configuration (`Frontend/.env`)

Create `Frontend/.env`:

```env
# URL of the running backend Express API
VITE_API_BASE_URL=http://localhost:4000
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0+ (v20+ recommended)
- **Python**: v3.10+ (v3.12 recommended)
- **Supabase PostgreSQL** instance

### 2. Database Setup & Seeding

1. **Install Python dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

2. **Initialize Schema & Stations:**
   ```powershell
   # Create tables (users, stations, aqi_data, symptoms, predictions)
   python DATASET/init_db.py

   # Seed 88 Maharashtra monitoring stations with coordinates
   python DATASET/init_stations.py
   ```

3. **Ingest Processed Historical Telemetry:**
   ```powershell
   # Bulk uploads cleaned and preprocessed station records to Supabase
   python DATASET/5-pushToDB.py
   ```

### 3. Start the Backend API

```powershell
cd Backend
npm install
npm run dev
```
> The API server will start on `http://localhost:4000`.

### 4. Start the Frontend Application

In a separate terminal:
```powershell
cd Frontend
npm install
npm run dev
```
> The React application will be available at `http://localhost:5173`.

---

## 🔄 Daily Data ETL Pipeline

To update the system with current air quality observations from the official CPCB portal:

```powershell
# 1. Scrape latest daily observations incrementally
python DATASET/3-updater.py

# 2. Compute 7-day moving averages, clean outliers, and compute lag features
python DATASET/4-mergeFiles.py

# 3. Push processed updates into Supabase (idempotent ON CONFLICT DO NOTHING)
python DATASET/5-pushToDB.py
```

---

## 🧠 ML Forecasting Model

Station-specific XGBoost models can be generated in two ways:
1. **Via the UI**: Navigate to **Trends** → select any station → click **AI Forecast** → **Train Model** (streams real-time SSE progress).
2. **Via CLI**:
   ```powershell
   python Model-XGBoost.py
   ```
   Trained models and feature encoders are saved into the `models/` directory (`station_<id>.pkl`).

---

## 📊 Air Quality Index Standards (PM2.5)

| Category | PM2.5 Range | Hex Color | Health Advisory |
|---|---|---|---|
| **Good** | 0 – 12 µg/m³ | `#10b981` | Air quality is satisfactory; minimal or no risk. |
| **Moderate** | 12.1 – 35.4 µg/m³ | `#fbbf24` | Acceptable quality; sensitive individuals should take caution. |
| **Unhealthy (Sensitive)** | 35.5 – 55.4 µg/m³ | `#f59e0b` | General public not likely affected; sensitive groups may experience effects. |
| **Unhealthy** | 55.5 – 150.4 µg/m³ | `#ef4444` | Increased likelihood of adverse effects in sensitive groups; general public impacted. |
| **Very Unhealthy / Severe** | 150.5+ µg/m³ | `#7c3aed` | Health alert: Everyone may experience more serious health effects. |

---

## 📄 License

ISC License
