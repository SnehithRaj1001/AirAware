# AirAware Testing & Troubleshooting Guide

## Testing Checklist

### Phase 1: Backend API Testing

#### 1. Authentication Endpoints

**Test: Register New User**
```bash
POST http://localhost:4000/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "password": "SecurePass123",
  "location": "Colaba"
}

Expected Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "location": "Colaba"
  }
}
```

**Test: Login**
```bash
POST http://localhost:4000/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123"
}

Expected Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "location": "Colaba"
  }
}
```

**Test: Get Profile (Protected)**
```bash
GET http://localhost:4000/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Expected Response:
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "location": "Colaba",
  "created_at": "2026-04-20T10:30:00Z"
}
```

#### 2. User Dashboard Endpoints

**Test: Get Dashboard Data (Protected)**
```bash
GET http://localhost:4000/user/dashboard
Authorization: Bearer <JWT_TOKEN>

Expected Response:
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
    "id": 100,
    "date": "2026-04-20T10:00:00Z",
    "pm25": 85.5,
    "pm10": 120.3,
    "o3": 45.2,
    "no2": 22.1,
    "so2": 15.6,
    "co": 0.8,
    "station_id": 1
  }
}
```

**Test: Get Trends (Protected)**
```bash
GET http://localhost:4000/user/trends
Authorization: Bearer <JWT_TOKEN>

Expected Response:
{
  "station": {
    "id": 1,
    "station_name": "Colaba"
  },
  "data": [
    {
      "date": "2026-03-21T00:00:00Z",
      "pm25": 90.2,
      "pm10": 125.5,
      "o3": 42.1,
      "no2": 20.5,
      "so2": 14.2,
      "co": 0.7
    },
    ...
  ]
}
```

#### 3. Public Endpoints

**Test: Get News**
```bash
GET http://localhost:4000/api/news

Expected Response:
[
  {
    "id": 1,
    "title": "Air Quality Improves in Major Cities",
    "description": "Recent improvements due to monsoon...",
    "date": "2026-04-18T00:00:00Z",
    "severity": "positive"
  },
  ...
]
```

**Test: Get All Stations**
```bash
GET http://localhost:4000/api/map/stations

Expected Response:
[
  {
    "id": 1,
    "stationName": "Colaba",
    "sourceUrl": "...",
    "latestAqi": {
      "date": "2026-04-20T10:00:00Z",
      "pm25": 85.5,
      ...
    }
  },
  ...
]
```

### Phase 2: Frontend Testing

#### 1. Navigation Flow
- [ ] Open http://localhost:5173
- [ ] Should redirect to /login
- [ ] Navbar shows only "Login" button

#### 2. Registration Flow
- [ ] Click "Register" on login form
- [ ] Fill in all fields
- [ ] Location field must match a station name (check database)
- [ ] Click "Register"
- [ ] Should redirect to dashboard
- [ ] Should display user name in navbar

#### 3. Dashboard Display
- [ ] Personalized AQI card shows:
  - [ ] Station name
  - [ ] All 6 pollutants (PM2.5, PM10, O3, NO2, SO2, CO)
  - [ ] Last updated timestamp
  - [ ] Color-coded badge (Good/Poor/etc)
- [ ] 30-day trends chart displays correctly
- [ ] News section shows news items
- [ ] Nearby stations section shows station list

#### 4. User Session
- [ ] Navbar shows logged-in user's name
- [ ] Logout button appears
- [ ] Click Logout → redirect to login
- [ ] Token removed from localStorage
- [ ] Cannot access dashboard after logout

#### 5. Protected Routes
- [ ] Clear localStorage (remove authToken)
- [ ] Try accessing /dashboard
- [ ] Should redirect to /login
- [ ] Login and verify redirect to /dashboard

#### 6. Token Expiration
- [ ] Create JWT token manually with 1-second expiry
- [ ] Wait for token to expire
- [ ] Make API request with expired token
- [ ] Should redirect to login
- [ ] localStorage should be cleared

### Phase 3: Error Handling

#### Backend Error Cases

**Invalid Login Credentials**
```bash
POST /auth/login
{
  "username": "nonexistent",
  "password": "wrong"
}

Expected: 401 - "Invalid credentials"
```

**Missing Required Fields**
```bash
POST /auth/register
{
  "firstName": "John"
  # Missing other fields
}

Expected: 400 - "All fields are required"
```

**Duplicate Username**
```bash
POST /auth/register
{
  "username": "johndoe"  # Already exists
  ...
}

Expected: 409 - "Username already exists"
```

**No Station for Location**
```bash
GET /user/dashboard
# User location: "InvalidCity" (no matching station)

Expected: 404 - "No station found for location: InvalidCity"
```

**Missing Token**
```bash
GET /user/dashboard
# No Authorization header

Expected: 401 - "No token provided"
```

**Invalid Token**
```bash
GET /user/dashboard
Authorization: Bearer invalid.token.here

Expected: 401 - "Invalid or expired token"
```

#### Frontend Error Handling

- [ ] Login with wrong password → error message displayed
- [ ] Register with mismatched passwords → error shown
- [ ] Register with existing username → error shown
- [ ] Invalid location → dashboard shows "No station found" error
- [ ] Network error → appropriate error message

### Phase 4: Data Validation

#### Database Consistency
```sql
-- Check users created successfully
SELECT * FROM users WHERE username = 'johndoe';

-- Check station matching
SELECT * FROM stations WHERE LOWER(station_name) LIKE '%colaba%';

-- Check AQI data
SELECT * FROM aqi_data WHERE station_id = 1 ORDER BY date DESC LIMIT 1;

-- Verify password hashing (should not be plain text)
SELECT username, LENGTH(password) FROM users;
```

#### API Response Validation
- [ ] All timestamps are ISO format
- [ ] Numeric values are proper numbers (not strings)
- [ ] User passwords never returned in responses
- [ ] JWT tokens are valid JWT format

---

## Common Issues & Solutions

### Issue 1: "No station found for location"

**Cause**: User's registered location doesn't match any station in the database.

**Solution**:
```sql
-- Check available stations
SELECT station_name FROM stations;

-- Register with a valid station name
-- Or insert new station:
INSERT INTO stations (station_name, source_url) 
VALUES ('New City', 'http://example.com');
```

### Issue 2: "Invalid or expired token" after login

**Cause**: Token verification failing due to JWT_SECRET mismatch.

**Solution**:
```bash
# Backend .env
JWT_SECRET=your-super-secret-key-must-be-same

# Restart backend server
npm start
```

### Issue 3: CORS errors in browser console

**Cause**: Frontend unable to reach backend.

**Solution**:
```bash
# Verify backend is running
curl http://localhost:4000

# Check frontend .env
VITE_API_BASE_URL=http://localhost:4000

# Restart frontend
npm run dev
```

### Issue 4: Database connection failed

**Cause**: PostgreSQL not running or credentials wrong.

**Solution**:
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify credentials in .env
DB_USER=postgres
DB_PASSWORD=admin
DB_HOST=localhost
DB_PORT=5432

# Test connection
psql -U postgres -h localhost -d AirAware
```

### Issue 5: Password comparison always fails

**Cause**: bcryptjs not installed or password not hashed during registration.

**Solution**:
```bash
# Reinstall bcryptjs
npm install bcryptjs

# Verify in authService.js:
const hashedPassword = await bcrypt.hash(password, 10);

# Re-register user to create new hash
```

### Issue 6: Token not being sent with requests

**Cause**: Axios interceptor not working or token not in localStorage.

**Solution**:
```javascript
// Check token in browser console:
console.log(localStorage.getItem('authToken'));

// Verify api.js interceptor:
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Issue 7: Dashboard shows but data is empty

**Cause**: AQI data not available in database for station.

**Solution**:
```sql
-- Check if AQI data exists
SELECT COUNT(*) FROM aqi_data WHERE station_id = 1;

-- Insert sample data if missing
INSERT INTO aqi_data (date, pm25, pm10, o3, no2, so2, co, station_id)
VALUES (NOW(), 85.5, 120.3, 45.2, 22.1, 15.6, 0.8, 1);
```

### Issue 8: Trends chart not displaying

**Cause**: No historical data (need 30 days of data).

**Solution**:
```sql
-- Insert multiple data points
-- Or reduce the date filter in userDashboardService.js from 30 days
-- Change: AND date >= CURRENT_DATE - INTERVAL '30 days'
-- To: AND date >= CURRENT_DATE - INTERVAL '1 day'
```

---

## Performance Testing

### Load Testing Checklist
- [ ] Dashboard loads within 2 seconds
- [ ] Charts render smoothly
- [ ] Multiple concurrent users can login
- [ ] No memory leaks in frontend

### Database Query Performance
```sql
-- Check query execution times
EXPLAIN ANALYZE
SELECT * FROM aqi_data 
WHERE station_id = 1 
AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date ASC;

-- Add index if needed:
CREATE INDEX idx_aqi_station_date 
ON aqi_data(station_id, date);
```

---

## Security Testing

### Authentication Security
- [ ] Passwords are hashed (never stored plain text)
- [ ] JWT tokens are signed with secret key
- [ ] Tokens expire after 7 days
- [ ] 401 response for invalid tokens
- [ ] HTTPS should be used in production

### Authorization Security
- [ ] Protected endpoints require valid token
- [ ] User can only access their own data
- [ ] No SQL injection vulnerabilities
- [ ] CORS configured properly

### Password Policy
- [ ] Passwords are hashed with bcryptjs
- [ ] Salt rounds: 10 (industry standard)
- [ ] Password comparison is constant-time (bcryptjs handles this)

---

## Browser Developer Tools Debugging

### Check Stored Token
```javascript
// In console:
localStorage.getItem('authToken')
localStorage.getItem('user')
```

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Perform login
4. Check /auth/login request:
   - Status should be 200
   - Response contains token

### Check API Calls
1. Go to Console tab
2. Monitor all API calls:
```javascript
// Intercept all fetch/axios calls
localStorage.getItem('authToken') // verify token exists
```

---

## Production Readiness Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for specific domains
- [ ] Add rate limiting
- [ ] Add request logging
- [ ] Configure database backups
- [ ] Monitor server resources
- [ ] Set up error tracking (Sentry)
- [ ] Configure monitoring/alerting
- [ ] Review security headers
- [ ] Test disaster recovery

---

## Support Resources

### Useful Commands

```bash
# Backend
npm install              # Install dependencies
npm start                # Start development server
npm run dev              # Start with nodemon

# Frontend
npm install              # Install dependencies
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Database
psql -U postgres -d AirAware   # Connect to DB
\dt                             # List tables
\d users                        # Show users table structure
```

### Debug Mode

```javascript
// Backend - Enable verbose logging:
// Add to server.js:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Frontend - Check console for errors:
// Open Browser DevTools → Console tab
```

### Documentation Links
- JWT: https://jwt.io/
- Bcryptjs: https://www.npmjs.com/package/bcryptjs
- Express Middleware: https://expressjs.com/en/guide/using-middleware.html
- React Hooks: https://react.dev/reference/react/hooks
- Axios: https://axios-http.com/
