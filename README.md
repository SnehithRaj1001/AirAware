# AirAware 🌍

**Real-time air quality monitoring, forecasting, and personalized health advisory platform for Maharashtra, India.**

AirAware ingests daily pollutant data from 88 CPCB monitoring stations, computes official CPCB AQI values, generates 14-day XGBoost forecasts, and delivers personalized health advisories based on user health profiles — all through an interactive React dashboard with live maps and trend analytics.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [ML Forecasting Model](#ml-forecasting-model)
- [Health Advisory System](#health-advisory-system)
- [AQI Calculation](#aqi-calculation)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Data Pipeline](#data-pipeline)

---

## Features

### Public (No Login Required)
- **Station Browser** — Browse all 88 CPCB stations with live AQI readings and color-coded cards
- **Interactive Map** — CARTO-powered map view with station pins, popups, and AQI heatmap coloring
- **Station Comparison** — Side-by-side comparison of multiple stations across all 7 pollutants
- **Real-Time AQI Dashboard** — Live pollutant concentrations with CPCB-compliant AQI computation

### Authenticated (Login Required)
- **Personalized Dashboard** — Overview of nearest station AQI, health risk score, and forecast snapshot
- **Station Details** — Deep-dive into individual station data with historical charts and 14-day forecast
- **Trend Analytics** — Interactive time-series charts with date-range filtering across all pollutants
- **Health Advisory** — AI-powered personalized health recommendations based on user profile, AQI forecast, and symptom history
- **Health Profile** — User health data: age, conditions (asthma, COPD, etc.), smoking status, activity level, sensitivity
- **Symptom Logger** — Track daily symptoms, medication usage, and outdoor exposure time

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  Pages: Dashboard, Map, Stations, Trends, Compare, Profile   │
│  Components: Navbar, StationCard, HealthAdvisoryWidget, etc. │
└────────────────────────────┬────────────────────────────────┘
                             │ REST API (JWT Auth)
┌────────────────────────────┴────────────────────────────────┐
│                    Backend (Express.js)                       │
│  Controllers → Services → Repositories → PostgreSQL (Supa.)  │
│                                                               │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────┐   │
│  │ forecastSvc   │  │ healthAdvisorySvc│  │ cpcbAqiCalc   │   │
│  │ (XGBoost .py) │  │ (rule engine +   │  │ (NAQI linear  │   │
│  │               │  │  Gemini API)     │  │  interpolation│   │
│  └──────────────┘  └──────────────────┘  └───────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────┐
│              PostgreSQL (Supabase)                            │
│  Tables: stations, aqi_data, users, user_symptom_logs,       │
│          user_health_advisories                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Router v6, Recharts, Leaflet/CARTO |
| **Backend** | Node.js, Express.js, ES Modules |
| **Database** | PostgreSQL (hosted on Supabase) |
| **ML Model** | Python, XGBoost, scikit-learn, pandas, NumPy |
| **Auth** | JWT (jsonwebtoken + bcryptjs) |
| **AI Advisory** | Google Gemini API (gemini-3.8-flash) |
| **AQI Standard** | CPCB National Air Quality Index (NAQI) |
| **Data Source** | CPCB continuous ambient air quality monitoring stations |

---

## Project Structure

```
AirAware/
├── Backend/
│   ├── controllers/          # Route handlers
│   │   ├── authController.js       # Register, login, profile CRUD
│   │   ├── publicController.js     # Map, news, station data (no auth)
│   │   ├── userController.js       # Dashboard, advisory, trends
│   │   ├── stationController.js    # Station details + forecast
│   │   ├── aqiController.js        # AQI data operations
│   │   └── rtaqiController.js      # Real-time AQI endpoint
│   ├── services/             # Business logic
│   │   ├── forecastService.js      # Manages XGBoost model lifecycle
│   │   ├── healthAdvisoryService.js # Risk scoring + Gemini AI
│   │   ├── stationService.js       # Station + CPCB AQI queries
│   │   ├── userDashboardService.js # Personalized dashboard data
│   │   ├── iotSensorService.js     # Real-time sensor data
│   │   └── mlService.py            # Python inference (called via child_process)
│   ├── repositories/         # Database access layer
│   ├── middleware/            # JWT auth middleware
│   ├── routes/               # Express route definitions
│   ├── utils/
│   │   └── cpcbAqiCalculator.js    # Official CPCB NAQI breakpoints
│   └── server.js             # Express app entry point
│
├── Frontend/
│   └── src/
│       ├── pages/
│       │   ├── PublicDashboard.jsx  # Station browser (public)
│       │   ├── UserDashboard.jsx    # Personalized dashboard (auth)
│       │   ├── MapView.jsx          # Interactive station map
│       │   ├── StationDetails.jsx   # Individual station deep-dive
│       │   ├── Trends.jsx           # Historical trend analytics
│       │   ├── Compare.jsx          # Multi-station comparison
│       │   ├── RtaqiDashboard.jsx   # Real-time AQI dashboard
│       │   ├── Profile.jsx          # Health profile + symptom logger
│       │   └── Login.jsx            # Auth (login + register)
│       ├── components/
│       │   ├── HealthAdvisoryWidget.jsx  # Advisory with tabs & AI insights
│       │   ├── Navbar.jsx           # Navigation bar
│       │   ├── StationCard.jsx      # Station AQI summary card
│       │   ├── PollutantChart.jsx   # Recharts pollutant chart
│       │   └── Skeleton.jsx         # Loading state skeletons
│       └── utils/
│           └── aqiStandards.js      # Frontend CPCB AQI calculator
│
├── DATASET/
│   ├── processed_data/       # 88 station CSVs (daily, Jan 2024–Oct 2026)
│   ├── 1-fetchStationNames.py      # Scrape CPCB station list
│   ├── 2-dowlnloadFiles.py         # Download raw data files
│   ├── 3-updater.py                # Selenium-based daily updater
│   ├── 4-mergeFiles.py             # Merge + clean raw data
│   ├── 5-pushToDB.py               # Push processed CSVs to PostgreSQL
│   └── Model-XGBoost.py            # Standalone training script
│
├── models/                   # Saved XGBoost .pkl model files
├── Model-XGBoost.py          # Main training script (DB + CSV support)
├── db.sql                    # Full database schema
├── requirements.txt          # Python dependencies
└── .env.example              # Environment variables template
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `stations` | 88 CPCB monitoring stations with GPS coordinates |
| `aqi_data` | Daily pollutant readings (PM2.5, PM10, NO₂, NH₃, SO₂, CO, O₃) with pre-computed lag and moving average features |
| `users` | User accounts with health profile (age, conditions, smoking, activity level, sensitivity) |
| `user_symptom_logs` | Daily symptom tracking (symptoms, severity, medication, outdoor time) |
| `user_health_advisories` | Cached advisory results per user/station/day |

---

## API Reference

### Public Endpoints (No Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/public/map/stations` | All stations with latest CPCB AQI |
| `GET` | `/api/public/map/stations/:id` | Single station with AQI data |
| `GET` | `/api/public/map/config` | CARTO map configuration |
| `GET` | `/api/public/news` | Air quality news feed |

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account with health profile |
| `POST` | `/api/auth/login` | Login, returns JWT token |
| `GET` | `/api/auth/profile` | Get user profile |
| `PUT` | `/api/auth/profile` | Update health profile |

### Protected Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/dashboard` | Personalized dashboard data |
| `GET` | `/api/user/advisory` | Health advisory with risk score |
| `GET` | `/api/user/trends` | Historical trend data |
| `GET` | `/api/stations/:id/details` | Station detail + forecast |
| `GET` | `/api/stations/:id/forecast` | 14-day XGBoost forecast (SSE stream) |
| `GET` | `/api/rtaqi/stream` | Real-time AQI updates (SSE) |

---

## ML Forecasting Model

### Approach: XGBoost with Residual Modelling

Instead of predicting absolute pollutant concentrations, the model predicts the **change from the previous day** (residual = `value[t] − value[t−1]`). The final forecast is computed as:

```
prediction[t] = actual[t-1] + predicted_change[t]
```

This ensures the model **cannot perform worse than persistence** (the "tomorrow = today" baseline) unless it actively produces harmful predictions.

### Feature Engineering

| Feature Type | Details |
|-------------|---------|
| Lag features | 1, 2, 3, 7, 14-day lags per pollutant |
| Rolling means | 3, 7, 14-day rolling averages (shifted by 1) |
| Momentum | 1-day and 7-day differences (`diff1`, `diff7`) |
| Calendar | Day-of-week, month, day-of-year (cyclical sine/cosine) |

### Hyperparameters

| Parameter | Value |
|-----------|-------|
| `n_estimators` | 500 (early stopping, patience=50) |
| `learning_rate` | 0.05 |
| `max_depth` | 4 |
| `subsample` | 0.8 |
| `colsample_bytree` | 0.8 |
| `reg_alpha` / `reg_lambda` | 0.1 / 1.0 |
| `min_child_weight` | 5 |

### Evaluation Results (88 stations, 616 evaluations)

| Pollutant | Mean RMSE | Mean MAE | Median R² | Mean MAPE (%) | Beats Persistence (%) |
|-----------|-----------|----------|-----------|---------------|----------------------|
| PM2.5 | 8.213 | 4.974 | 0.676 | 23.51 | 97.7 |
| PM10 | 16.115 | 11.003 | 0.699 | 21.27 | 100.0 |
| NO₂ | 4.387 | 2.527 | 0.726 | 19.23 | 85.2 |
| NH₃ | 5.279 | 2.714 | 0.695 | 21.42 | 81.8 |
| SO₂ | 2.327 | 1.348 | 0.555 | 36.04 | 85.2 |
| CO | 0.145 | 0.091 | 0.685 | 22.39 | 85.2 |
| O₃ | 6.170 | 3.938 | 0.729 | 22.50 | 88.6 |

**Overall: 89.1% of station-pollutant pairs beat the persistence baseline** (549/616).

---

## Health Advisory System

A **rule-based risk scoring engine** that generates personalized health recommendations.

### How It Works

1. **Inputs**: User health profile (age, conditions, smoking, activity level, sensitivity) + AQI value for today and next 3 forecast days
2. **Scoring**: Risk score from 5–100, computed as:
   - AQI component (0–50 points) + Vulnerability component (0–50 points) × Amplifier
   - Amplifier: ×1.1 for AQI > 100, ×1.25 for AQI > 200
3. **Vulnerability weights**: COPD (+18), Asthma (+16), Heart disease (+14), Allergies (+8), Diabetes (+6), plus age/smoking/sensitivity/activity modifiers
4. **Risk levels**: Low (<20), Guarded (20–34), Moderate (35–54), High (55–74), Critical (≥75)
5. **Outputs**: 4 tips (outdoor, mask, ventilation, medication), alert chips, score breakdown
6. **Optional AI**: Google Gemini generates 2–3 supplementary suggestions, cached per user/station/day

> **Note**: This is a hand-weighted rule system, not an ML model. The Gemini integration is optional and provides supplementary narrative text only.

---

## AQI Calculation

AirAware implements the **official CPCB National Air Quality Index (NAQI)** using linear interpolation:

```
Ip = [(I_Hi - I_Lo) / (B_Hi - B_Lo)] × (Cp - B_Lo) + I_Lo
```

- Sub-indices are computed for each pollutant against CPCB breakpoint tables
- Overall AQI = max(all sub-indices)
- Requires at least 3 pollutants monitored, with at least one being PM2.5 or PM10
- Implemented in both backend (`cpcbAqiCalculator.js`) and frontend (`aqiStandards.js`)

### AQI Categories

| AQI Range | Category | Color |
|-----------|----------|-------|
| 0–50 | Good | Green |
| 51–100 | Satisfactory | Light Green |
| 101–200 | Moderate | Yellow |
| 201–300 | Poor | Orange |
| 301–400 | Very Poor | Red |
| 401–500 | Severe | Dark Red |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10 (for ML model)
- **PostgreSQL** database (or Supabase account)

### 1. Clone & Install

```bash
git clone https://github.com/SnehithRaj1001/AirAware.git
cd AirAware

# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install

# Python dependencies (for ML model)
cd ..
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy and edit the environment files
cp .env.example .env
cp Backend/.env.example Backend/.env
```

Edit `.env` and `Backend/.env` with your database URL, JWT secret, and optional API keys. See [Environment Variables](#environment-variables) for details.

### 3. Set Up Database

Run `db.sql` against your PostgreSQL database to create all required tables:

```bash
psql -d your_database -f db.sql
```

### 4. Load Station Data

```bash
cd DATASET
python init_stations.py      # Insert 88 station records
python 5-pushToDB.py         # Push processed CSV data to aqi_data
```

### 5. Run Development Servers

```bash
# Terminal 1: Backend (http://localhost:4000)
cd Backend
npm run dev

# Terminal 2: Frontend (http://localhost:5173)
cd Frontend
npm run dev
```

### 6. Train Forecast Models (Optional)

Models are automatically trained on first request. To pre-train:

```bash
# Train for a specific station (by DB ID or CSV path)
python Model-XGBoost.py 9
python Model-XGBoost.py DATASET/processed_data/Mumbai_Bandra_Kurla_Complex__Mumbai___MPCB.csv
```

Trained models are saved to `models/` as `.pkl` files.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Backend port (default: 4000) |
| `NODE_ENV` | No | `development` or `production` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | Secret for JWT token signing |
| `JWT_EXPIRY` | No | Token expiry (default: `7d`) |
| `SUPABASE_URL` | No | Supabase project URL (for IoT sensor data) |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key |
| `CARTO_API_KEY` | No | CARTO Maps API key (for map tiles) |
| `GEMINI_API_KEY` | No | Google AI API key (for AI advisory insights) |

---

## Data Pipeline

The data pipeline scrapes, processes, and loads air quality data from CPCB stations:

```
1-fetchStationNames.py  →  Scrape station names from CPCB portal
         ↓
2-downloadFiles.py      →  Download raw CSV data per station
         ↓
3-updater.py            →  Selenium-based daily data updater
         ↓
4-mergeFiles.py         →  Merge, clean, compute lag/MA features
         ↓
5-pushToDB.py           →  Upload processed data to PostgreSQL
```

**Dataset**: 88 stations × ~1,000 days × 7 pollutants (Jan 2024 – Oct 2026)

---

## License

ISC
