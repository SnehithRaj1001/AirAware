# AirAware System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AIRAWARE APPLICATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          FRONTEND (React + Vite)                     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  • Login/Register Page                               │   │
│  │  • Protected Dashboard (with charts, news, stations) │   │
│  │  • Trends Page                                       │   │
│  │  • Navbar with Authentication                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                        ↓ (Axios + JWT)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          BACKEND (Node.js + Express)                 │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │                                                      │   │
│  │  Routes Layer:                                       │   │
│  │  • /auth (login, register, profile)                 │   │
│  │  • /user (dashboard, trends) - protected            │   │
│  │  • /api (news, stations)                             │   │
│  │                                                      │   │
│  │  Controllers Layer:                                  │   │
│  │  • authController - handles auth logic              │   │
│  │  • userController - user-specific data              │   │
│  │  • publicController - shared data                    │   │
│  │                                                      │   │
│  │  Services Layer:                                     │   │
│  │  • authService - JWT, password hashing              │   │
│  │  • userDashboardService - data aggregation          │   │
│  │                                                      │   │
│  │  Repositories Layer:                                 │   │
│  │  • userRepository - user CRUD                        │   │
│  │  • aqiRepository - air quality data                  │   │
│  │  • stationRepository - station data                  │   │
│  │                                                      │   │
│  │  Middleware:                                         │   │
│  │  • authMiddleware - JWT verification                │   │
│  │  • errorHandler - error handling                     │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                        ↓ (SQL Queries)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          DATABASE (PostgreSQL)                        │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Tables:                                             │   │
│  │  • users (id, first_name, last_name, username,      │   │
│  │           password, location, created_at)            │   │
│  │  • stations (id, station_name, source_url)          │   │
│  │  • aqi_data (id, date, pm25, pm10, o3, no2,        │   │
│  │             so2, co, station_id)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
┌─────────────────┐
│  User Opens    │
│   Login Page    │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│  User Fills Form:        │
│  - Username              │
│  - Password              │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Frontend sends POST     │
│  /auth/login             │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Backend:                │
│  authController.login()  │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  authService.loginUser() │
│  1. Find user by username│
│  2. Compare passwords    │
│  3. Generate JWT token   │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Return:                 │
│  - JWT Token             │
│  - User Details          │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Frontend:               │
│  1. Store token in      │
│     localStorage         │
│  2. Redirect to         │
│     dashboard            │
└──────────────────────────┘
```

## Protected Route Access Flow

```
┌──────────────────────────┐
│  User Navigates to       │
│  /dashboard              │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Frontend:               │
│  <ProtectedRoute>        │
│  Check localStorage for  │
│  authToken               │
└────────┬─────────────────┘
         │
    ┌────┴─────────┐
    │              │
Token Found?    No Token?
    │              │
    ▼              ▼
Render Page   Redirect to
              /login
```

## Personalized Dashboard Flow

```
┌──────────────────────────┐
│  User Accesses          │
│  /dashboard              │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Dashboard.jsx           │
│  useEffect loads 4       │
│  parallel requests       │
└────────┬─────────────────┘
         │
    ┌────┼────┬────┬────┐
    │    │    │    │    │
    ▼    ▼    ▼    ▼    ▼
   API1 API2 API3 API4  (Parallel)
    │    │    │    │
    ├─── ├─── ├─── ├───────────┐
    │    │    │    │            │
    ▼    ▼    ▼    ▼            ▼
 User  Trends News Stations   Database
Dashboard   30d   Mock List    Queries
  Data      Data            (via repos)
    │    │    │    │            │
    └──── ──── ──── ────────────┘
         │
         ▼
    ┌─────────────────────────┐
    │ Update component state  │
    └────┬────────────────────┘
         │
         ▼
    ┌─────────────────────────┐
    │ Render:                 │
    │ - Welcome section       │
    │ - AQI card with colors  │
    │ - Trends chart (Area)   │
    │ - News list             │
    │ - Station previews      │
    └─────────────────────────┘
```

## Data Flow for User Dashboard Request

```
Frontend Request:
GET /user/dashboard
Authorization: Bearer <JWT_TOKEN>

     ↓

Backend Processing:
1. authMiddleware
   ├─ Extract token from headers
   ├─ Verify JWT signature
   └─ Attach user data to req

2. userController.getDashboard()
   └─ Extract userId from req.user

3. userDashboardService.getUserDashboardData()
   ├─ Find user by ID
   │  (Query: users table)
   │
   ├─ Find station by location
   │  (Query: stations LIKE location)
   │
   └─ Get latest AQI for station
      (Query: aqi_data ORDER BY date DESC LIMIT 1)

4. Return Response:
   {
     "user": {
       "firstName": "John",
       "lastName": "Doe",
       "location": "Colaba"
     },
     "station": {
       "id": 1,
       "station_name": "Colaba",
       "source_url": "..."
     },
     "latestAqi": {
       "date": "2026-04-20",
       "pm25": 85.5,
       "pm10": 120.3,
       "o3": 45.2,
       "no2": 22.1,
       "so2": 15.6,
       "co": 0.8
     }
   }

     ↓

Frontend Processing:
1. Store data in component state
2. Calculate AQI level (Good/Poor/etc)
3. Get color based on PM2.5 value
4. Render AQI card with styling
5. Display user location info
```

## Layered Architecture

### Routes Layer
- Entry points for all API requests
- Minimal logic - route to controller
- Middleware application

### Controllers Layer
- Validates request parameters
- Calls service layer
- Formats response

### Services Layer
- Business logic
- Data validation
- Coordination with repositories
- Token generation, password hashing

### Repositories Layer
- Direct database access
- SQL query execution
- Data retrieval/persistence

### Middleware Layer
- JWT verification
- Error handling
- Cross-cutting concerns

## Security Implementation

### Password Security
```
User Registration:
1. bcryptjs.hash(password, 10)
   → Generates salt and hash
   → Stored in database

User Login:
1. Retrieve password hash from db
2. bcryptjs.compare(inputPassword, storedHash)
   → Compares without revealing plaintext
3. If match → Generate JWT
4. If no match → Return 401
```

### JWT Token Flow
```
1. Server Secret Key: process.env.JWT_SECRET
   └─ Must be kept secure in production

2. Token Generation:
   jwt.sign({
     id: userId,
     username: username,
     location: location
   }, JWT_SECRET, { expiresIn: '7d' })

3. Token Storage (Frontend):
   localStorage.setItem('authToken', token)

4. Token Usage (Frontend):
   Every request adds:
   Authorization: Bearer <token>

5. Token Verification (Backend):
   jwt.verify(token, JWT_SECRET)
   ├─ If valid → Extract user data
   ├─ If expired → 401 error
   └─ If invalid signature → 401 error
```

## Database Schema

```sql
-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  username VARCHAR(100) UNIQUE,
  password VARCHAR(255),           -- bcrypt hash
  location VARCHAR(100),            -- Station name
  created_at TIMESTAMP
);

-- Stations Table
CREATE TABLE stations (
  id SERIAL PRIMARY KEY,
  station_name VARCHAR(255),
  source_url VARCHAR(500)
);

-- AQI Data Table
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

## Component Hierarchy (Frontend)

```
App.jsx
├── Navbar
│   ├── NavLink to Dashboard
│   ├── NavLink to Trends
│   └── User Section (Login/Logout)
│
└── Routes
    ├── /login
    │   └── Login (LoginPage)
    │       ├── Login Form
    │       └── Register Form
    │
    ├── / (protected)
    │   └── ProtectedRoute
    │       └── Dashboard
    │           ├── Welcome Section
    │           ├── Current AQI Card
    │           ├── Trends Chart (Recharts)
    │           ├── News Section
    │           └── Nearby Stations
    │
    └── /trends (protected)
        └── ProtectedRoute
            └── Trends (existing component)
```

## Error Handling Flow

```
Error in Backend:
1. Controller catches error
   └─ next(error)

2. Error reaches errorHandler middleware
   └─ Format response

3. Return Error Response:
   {
     "status": 401,
     "error": "Invalid credentials"
   }

Error in Frontend:
1. axios.interceptors.response
   ├─ Check for 401
   ├─ If 401:
   │  ├─ Remove token
   │  └─ Redirect to login
   └─ Reject promise

2. Component catches error
   └─ Display error message

3. User sees error in UI
```

## Performance Considerations

1. **Parallel Data Loading**
   - Frontend loads dashboard, trends, news, stations simultaneously
   - Not sequentially
   - Reduces total load time

2. **30-Day Data Limit**
   - Trends query limited to last 30 days
   - Reduces database query load
   - Acceptable for trends visualization

3. **Token-Based Auth**
   - Stateless authentication
   - No server-side session storage
   - Scales well

4. **Indexed Queries**
   - Consider adding indexes on:
     - users.username
     - stations.station_name
     - aqi_data.station_id, date

## Scalability Improvements

1. **Caching**
   - Cache station data with Redis
   - Cache AQI data for recent queries

2. **Database Optimization**
   - Add composite indexes
   - Archive old AQI data

3. **API Rate Limiting**
   - Prevent abuse
   - Protect backend resources

4. **Load Balancing**
   - Multiple backend instances
   - Database replication

5. **Microservices**
   - Separate auth service
   - Separate data service
   - Separate notification service

## Testing Strategy

### Backend Tests
- Unit tests for services
- Integration tests for API endpoints
- Authentication tests

### Frontend Tests
- Component unit tests
- Integration tests for user flows
- E2E tests with Cypress/Playwright

### Test Coverage
- Auth flow (login/register)
- Protected route access
- Dashboard data loading
- Error handling
