# AirAware Authentication & Personalized Dashboard Implementation

## Overview
This document outlines the implementation of user authentication and a personalized dashboard for the AirAware Air Quality Monitoring Web Application.

---

## BACKEND IMPLEMENTATION

### 1. **Authentication System**

#### Dependencies Added
- `jsonwebtoken`: For JWT token generation and verification
- `bcryptjs`: For password hashing and comparison

#### New Files Created

##### Middleware: `middleware/authMiddleware.js`
- Verifies JWT tokens in request headers
- Extracts user information and attaches to request object
- Returns 401 for invalid/missing tokens

##### Repositories: `repositories/userRepository.js`
- `findUserByUsername()`: Find user by username
- `findUserById()`: Find user by ID
- `createUser()`: Create new user
- `updateUserLocation()`: Update user's monitored location

##### Services: `services/authService.js`
- `loginUser()`: Authenticate user with username/password
  - Validates credentials against users table
  - Compares hashed passwords
  - Generates JWT token (expires in 7 days by default)
  - Returns token + user details
  
- `registerUser()`: Create new user account
  - Validates username uniqueness
  - Hashes password with bcrypt
  - Generates JWT token for new user
  
- `getUserProfile()`: Fetch user profile information

##### Controllers: `controllers/authController.js`
- `POST /auth/login`: Login endpoint
- `POST /auth/register`: Registration endpoint
- `GET /auth/profile`: Get logged-in user's profile (protected)

##### Routes: `routes/auth.js`
- Defines authentication endpoints
- `/auth/login` (POST)
- `/auth/register` (POST)
- `/auth/profile` (GET - protected)

### 2. **User-Based Dashboard**

#### New Files Created

##### Services: `services/userDashboardService.js`
- `getUserDashboardData()`: 
  - Retrieves logged-in user's data
  - Finds monitoring station based on user's location
  - Fetches latest AQI data for that station
  - Returns user info, station data, and latest pollutant values

- `getUserTrends()`:
  - Fetches 30-day historical AQI data
  - Filters data for user's assigned station
  - Returns time-series data for charting

##### Controllers: `controllers/userController.js`
- `GET /user/dashboard`: Personalized dashboard data (protected)
- `GET /user/trends`: Historical trends for user's location (protected)

##### Routes: `routes/user.js`
- Defines user-specific endpoints
- All routes protected with auth middleware
- `/user/dashboard` (GET)
- `/user/trends` (GET)

### 3. **Public APIs**

#### New Files Created

##### Controllers: `controllers/publicController.js`
- `getNews()`: Returns mock air quality news/alerts
  - Includes severity levels (positive, warning, alert, info)
  - Suitable for replacement with real news API

- `getAllStations()`: Returns all monitoring stations with latest AQI
  - Includes station metadata and latest pollutant readings

- `getStationWithAqi()`: Returns specific station with latest data

##### Routes: `routes/public.js`
- `/api/news` (GET): Air quality news
- `/api/map/stations` (GET): All stations with AQI data
- `/api/map/stations/:stationId` (GET): Specific station data

### 4. **Updated Server Configuration**

Modified `server.js` to include:
```javascript
app.use("/auth", authRoutes);        // Authentication
app.use("/user", userRoutes);        // Protected user routes
app.use("/api", publicRoutes);       // Public endpoints
```

---

## DATABASE REQUIREMENTS

The implementation assumes the following tables exist:

### `users` Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `stations` Table (Existing)
```sql
CREATE TABLE stations (
  id SERIAL PRIMARY KEY,
  station_name VARCHAR(255),
  source_url VARCHAR(500)
);
```

### `aqi_data` Table (Existing)
```sql
CREATE TABLE aqi_data (
  id SERIAL PRIMARY KEY,
  date TIMESTAMP,
  pm25 FLOAT,
  pm10 FLOAT,
  o3 FLOAT,
  no2 FLOAT,
  so2 FLOAT,
  co FLOAT,
  station_id INTEGER REFERENCES stations(id)
);
```

---

## FRONTEND IMPLEMENTATION

### 1. **API Client with Interceptors**

Updated `src/api.js`:
- Axios-based HTTP client with base configuration
- Request interceptor: Automatically adds JWT token to headers
- Response interceptor: Handles 401 errors and redirects to login
- Organized API methods by module:
  - `authAPI`: Login, register, profile
  - `userAPI`: Dashboard, trends
  - `publicAPI`: News, stations, maps
- Backward compatible with legacy fetch-based endpoints

### 2. **Authentication Pages**

#### New Component: `src/pages/Login.jsx`
- Toggle between Login and Registration forms
- Login form: username, password
- Registration form: first name, last name, username, password, location
- Form validation and error handling
- JWT token storage in localStorage
- Automatic redirect to dashboard on successful auth
- Responsive design with gradient background

#### Styling: `src/pages/Login.css`
- Modern gradient UI
- Form validation feedback
- Mobile-responsive layout
- Smooth transitions and hover effects

### 3. **Protected Routes**

#### New Component: `src/components/ProtectedRoute.jsx`
- Checks for JWT token in localStorage
- Redirects to login if token missing
- Wraps authenticated pages

### 4. **Navigation Bar**

#### New Component: `src/components/Navbar.jsx`
- Responsive header with AirAware branding
- Shows "Login" button when not authenticated
- Shows username + "Logout" button when authenticated
- Navigation links to Dashboard and Trends
- Active route highlighting

#### Styling: `src/components/Navbar.css`
- Gradient purple background
- Sticky positioning
- Responsive mobile layout
- User profile section with logout button

### 5. **Personalized Dashboard**

#### Updated Component: `src/pages/Dashboard.jsx`
Features:
- **Welcome Section**: Displays user's name and monitored location
- **Current AQI Card**: Shows latest pollutant readings
  - PM2.5, PM10, O₃, NO₂, SO₂, CO
  - Color-coded severity levels (Good → Very Poor)
  - Last updated timestamp
  
- **30-Day Trends Chart**: Area chart showing historical data
  - PM2.5 and PM10 trends over 30 days
  - Interactive tooltips and legend
  
- **News Section**: Air quality related news and alerts
  - Color-coded by severity (positive, warning, alert, info)
  - Date and description
  
- **Nearby Stations**: Quick view of other monitoring stations
  - Station names and latest PM2.5
  - AQI level indicators
  - Link to view all stations

#### Styling: `src/pages/Dashboard.css`
- Grid-based responsive layout
- Card-based UI components
- Color-coded AQI levels
- Loading spinner animation
- Mobile-responsive design

### 6. **Updated App Component**

Modified `src/App.jsx`:
- Imports Navbar component
- Wraps protected routes with ProtectedRoute
- Added `/login` route
- Redirects unknown routes to home page
- All existing routes protected

### 7. **Dependencies**

Updated `Frontend/package.json`:
- `axios`: HTTP client with interceptor support
- `jwt-decode`: JWT token decoding (if needed for client-side parsing)

---

## SECURITY FEATURES

1. **JWT Authentication**
   - Tokens stored in localStorage
   - Automatic token inclusion in API headers
   - Server-side token verification
   - 7-day token expiration (configurable)

2. **Password Security**
   - Bcryptjs password hashing
   - Passwords never stored in plain text
   - Secure password comparison

3. **Protected Routes**
   - Frontend route protection with ProtectedRoute component
   - Backend route protection with authMiddleware
   - 401 responses for unauthenticated requests

4. **Auto-Logout**
   - On 401 response, token removed and user redirected to login
   - Prevents access with expired tokens

---

## API ENDPOINTS SUMMARY

### Authentication
- `POST /auth/login` - Login user
- `POST /auth/register` - Register new user
- `GET /auth/profile` - Get user profile (protected)

### User Dashboard (Protected)
- `GET /user/dashboard` - Get user's personalized dashboard
- `GET /user/trends` - Get 30-day trends for user's location

### Public APIs
- `GET /api/news` - Air quality news and alerts
- `GET /api/map/stations` - All stations with latest AQI
- `GET /api/map/stations/:stationId` - Specific station data

---

## SETUP & DEPLOYMENT INSTRUCTIONS

### Backend Setup
```bash
cd Backend
npm install  # Installs jsonwebtoken, bcryptjs, and other dependencies
npm start    # Starts server on http://localhost:4000
```

### Frontend Setup
```bash
cd Frontend
npm install  # Installs axios and other dependencies
npm run dev  # Starts dev server on http://localhost:5173
```

### Environment Variables

Create `.env` file in Backend directory:
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=AirAware
DB_PASSWORD=admin
DB_PORT=5432
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRY=7d
PORT=4000
```

Create `.env` file in Frontend directory:
```
VITE_API_BASE_URL=http://localhost:4000
```

---

## PRODUCTION CONSIDERATIONS

1. **Password Hashing**: Currently using bcryptjs for secure password hashing. This is production-ready.

2. **JWT Secret**: Change `JWT_SECRET` to a strong random string in production.

3. **HTTPS**: Deploy with HTTPS to protect JWT tokens in transit.

4. **CORS**: Configure CORS properly for your production domain.

5. **Token Refresh**: Consider implementing refresh tokens for extended sessions.

6. **Rate Limiting**: Add rate limiting to prevent brute force attacks.

7. **Input Validation**: Implement stricter validation on both frontend and backend.

8. **Error Handling**: Avoid exposing sensitive information in error messages.

---

## FUTURE ENHANCEMENTS

1. **AQI Predictions**: Add ML-based pollution forecasting
2. **Health Alerts**: Notify users of dangerous pollution levels
3. **Multiple Locations**: Allow users to monitor multiple locations
4. **Social Features**: Share air quality data with friends
5. **Mobile App**: React Native version
6. **Real-time Updates**: WebSocket integration for live data
7. **Historical Analytics**: Detailed trend analysis and reports
8. **Device Integration**: Connect wearable air quality sensors

---

## TESTING RECOMMENDATIONS

### Sample Login Credentials (after user registration)
- Username: testuser
- Password: TestPassword123

### Test Cases
1. Register new user
2. Login with valid credentials
3. Access protected dashboard
4. Attempt to access dashboard without login (should redirect)
5. Logout and verify redirect to login
6. Test with expired token

---

## File Structure Summary

```
Backend/
├── middleware/
│   ├── authMiddleware.js (NEW)
│   └── errorHandler.js
├── repositories/
│   ├── userRepository.js (NEW)
│   ├── aqiRepository.js
│   └── stationRepository.js
├── routes/
│   ├── auth.js (NEW)
│   ├── user.js (NEW)
│   ├── public.js (NEW)
│   ├── aqi.js
│   ├── stations.js
│   └── dashboard.js
├── services/
│   ├── authService.js (NEW)
│   ├── userDashboardService.js (NEW)
│   ├── aqiService.js
│   └── dashboardService.js
├── controllers/
│   ├── authController.js (NEW)
│   ├── userController.js (NEW)
│   ├── publicController.js (NEW)
│   ├── aqiController.js
│   ├── dashboardController.js
│   └── stationController.js
├── db.js
├── server.js (UPDATED)
└── package.json (UPDATED)

Frontend/
├── src/
│   ├── api.js (UPDATED)
│   ├── App.jsx (UPDATED)
│   ├── pages/
│   │   ├── Login.jsx (NEW)
│   │   ├── Login.css (NEW)
│   │   ├── Dashboard.jsx (UPDATED)
│   │   ├── Dashboard.css (NEW)
│   │   ├── Trends.jsx
│   │   └── StationDetails.jsx
│   └── components/
│       ├── Navbar.jsx (NEW)
│       ├── Navbar.css (NEW)
│       ├── ProtectedRoute.jsx (NEW)
│       ├── PollutantChart.jsx
│       ├── StationCard.jsx
│       └── StationCard.css
└── package.json (UPDATED)
```

---

## Support & Troubleshooting

### Common Issues

1. **401 Unauthorized on protected routes**
   - Ensure JWT token is in localStorage
   - Check token expiration
   - Verify backend JWT_SECRET matches

2. **CORS errors**
   - Check frontend API_BASE_URL
   - Verify backend CORS configuration

3. **Database connection errors**
   - Check PostgreSQL is running
   - Verify DB credentials in .env
   - Ensure AirAware database exists

4. **Password comparison fails**
   - Ensure bcryptjs is installed
   - Check password hashing in authService

---

## Implementation Complete! ✅

All authentication and personalized dashboard features have been successfully implemented and are ready for testing and deployment.
