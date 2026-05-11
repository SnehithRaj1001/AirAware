# AirAware - Quick Start Guide

## Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- Git (optional)

## Installation & Running

### 1. Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Install dependencies (new packages: jsonwebtoken, bcryptjs)
npm install

# Create .env file with database configuration
# DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT
# JWT_SECRET, JWT_EXPIRY, PORT

# Start the backend server
npm start
# Server runs on http://localhost:4000
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory (in another terminal)
cd Frontend

# Install dependencies (new packages: axios, jwt-decode)
npm install

# Create .env file
# VITE_API_BASE_URL=http://localhost:4000

# Start the frontend development server
npm run dev
# Frontend runs on http://localhost:5173
```

## First Time Setup

### Database
Ensure PostgreSQL is running and the `AirAware` database exists with the required tables:
- `users` - user accounts and profiles
- `stations` - air quality monitoring stations
- `aqi_data` - air quality measurements

### Register a User
1. Open http://localhost:5173 in browser
2. Click "Register" on login page
3. Fill in:
   - First Name
   - Last Name
   - Username
   - Password
   - Location (e.g., "Colaba" - must match a station name)
4. Click "Register"

### Login
Use the credentials you just created to login.

## Key Features

✅ **User Authentication**
- Secure login/registration with JWT
- Password hashing with bcryptjs
- Protected dashboard routes

✅ **Personalized Dashboard**
- View AQI data for your monitored location
- Real-time pollutant readings (PM2.5, PM10, O₃, NO₂, SO₂, CO)
- 30-day historical trends chart
- Air quality news and alerts
- Nearby stations overview

✅ **Color-Coded AQI Levels**
- Green: Good (0-50)
- Yellow: Satisfactory (51-100)
- Orange: Moderately Polluted (101-200)
- Red: Poor (201-300)
- Dark Red: Very Poor (300+)

## API Endpoints

### Authentication
- `POST /auth/login` - Login
- `POST /auth/register` - Create new account
- `GET /auth/profile` - Get profile (protected)

### User Dashboard (Protected)
- `GET /user/dashboard` - Personalized AQI data
- `GET /user/trends` - 30-day trends

### Public
- `GET /api/news` - Air quality news
- `GET /api/map/stations` - All stations

## Troubleshooting

### "No station found for location"
- Ensure your registered location matches a station name in the database
- Check stations table for available locations

### "Invalid credentials"
- Verify username and password
- Check if user was created successfully

### "No data available"
- Ensure there's AQI data in the database for your station
- Check aqi_data table

### CORS Errors
- Verify backend is running on http://localhost:4000
- Check VITE_API_BASE_URL in frontend .env

## Next Steps

1. **Test the application** - Login and explore features
2. **Check the database** - Verify user and AQI data
3. **Customize settings** - Update JWT_SECRET for production
4. **Add real news API** - Replace mock news with real sources
5. **Deploy** - Follow production deployment guide

---

For detailed implementation documentation, see [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
