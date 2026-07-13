# AirAware - Air Quality Monitoring & Forecasting

A full-stack web application for monitoring and forecasting air quality across 88 stations in Maharashtra, India, using XGBoost ML models trained on historical CPCB data.

## Features

- **Live Dashboard** — Latest AQI readings from all 88 stations
- **Forecasting** — XGBoost-powered 7-day air quality predictions
- **Trend Analysis** — Interactive charts for all pollutants
- **Color-coded AQI alerts** — EPA standard PM2.5 levels
- **Responsive Design** — Desktop and mobile support

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ML Models | Python, XGBoost |
| Data Pipeline | Python, Selenium, Pandas |

## Project Structure

```
AirAware/
├── Backend/            # Express.js API server
├── Frontend/           # React app
├── DATASET/            # Data pipeline scripts
│   ├── 1-fetchStationNames.py
│   ├── 2-downloadFiles.py
│   ├── 3-updater.py       # Selenium scraper (CPCB portal)
│   ├── 4-mergeFiles.py    # Merge + preprocess + feature engineering
│   ├── 5-pushToDB.py      # Push processed CSVs to PostgreSQL
│   ├── init_db.py         # Create DB tables from db.sql
│   ├── init_stations.py   # Seed stations table
│   ├── downloaded_data/   # Raw CSVs (gitignored)
│   └── processed_data/    # ML-ready CSVs (gitignored)
├── models/             # Trained XGBoost .pkl files
├── db.sql              # Database schema
├── Model-XGBoost.py    # XGBoost training script
└── .env                # DB credentials (gitignored)
```

## Database Schema

**stations** — 88 MPCB/IITM/BMC monitoring stations with lat/lon and address.

**aqi_data** — Daily readings per station with 39 features: raw pollutants (`pm25`, `pm10`, `no2`, `nh3`, `so2`, `co`, `ozone`), lag features (`_lag1`, `_lag7`, `_lag14`), 7-day moving averages, and date features (`month`, `day_of_week`, `is_weekend`).

## Getting Started

### Prerequisites
- Node.js v16+
- PostgreSQL v12+
- Python 3.10+

### 1. Configure credentials

Fill in `.env` at the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password
```

### 2. Set up the database

```bash
python DATASET/init_db.py       # Creates tables
python DATASET/init_stations.py # Seeds 88 stations
```

### 3. Populate data

```bash
python DATASET/3-updater.py     # Scrape data from CPCB (requires Chrome)
python DATASET/4-mergeFiles.py  # Merge years, interpolate, engineer features
python DATASET/5-pushToDB.py    # Push to database
```

> **Note:** `3-updater.py` opens a browser and requires you to solve a CAPTCHA manually on the first run. If a station has no data for the selected range the scraper skips it automatically.

### 4. Run the app

```bash
# Backend
cd Backend && npm install && npm run dev   # http://localhost:4000

# Frontend
cd Frontend && npm install && npm run dev  # http://localhost:5173
```

## Daily Data Updates

Re-run steps 3 → 4 → 5 above. The scraper automatically resumes from the last recorded date per station, and the database insert uses `ON CONFLICT DO NOTHING` to skip duplicates.

## Air Quality Color Coding (PM2.5)

| Level | Range |
|---|---|
| 🟢 Good | 0–12 µg/m³ |
| 🟡 Moderate | 12.1–35.4 µg/m³ |
| 🟠 Unhealthy for Sensitive Groups | 35.5–55.4 µg/m³ |
| 🔴 Unhealthy | 55.5–150.4 µg/m³ |
| 🟣 Very Unhealthy | 150.5+ µg/m³ |

## License

ISC License
