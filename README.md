# AirAware - Air Quality Monitoring Web Application

A full-stack web application for monitoring air quality data across multiple stations, featuring real-time dashboards, historical trends, and detailed pollutant analysis.

## 🚀 Features

- **Real-time Dashboard**: View latest air quality readings from all stations
- **Station Details**: Detailed pollutant information for individual stations
- **Trend Analysis**: Interactive charts showing air quality trends over time
- **Search & Filter**: Find stations by name and sort by pollution levels
- **Color-coded Alerts**: Visual indicators for air quality levels based on PM2.5 values
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠 Tech Stack

### Backend

- **Node.js** with **Express.js**
- **PostgreSQL** database
- **pg** library for database operations
- **CORS** for cross-origin requests
- **dotenv** for environment configuration

### Frontend

- **React 19** with modern hooks
- **React Router** for navigation
- **Recharts** for data visualization
- **Vite** for fast development and building
- **CSS** with modern responsive design

## 📊 Database Schema

### stations table

```sql
CREATE TABLE stations (
  id SERIAL PRIMARY KEY,
  station_name TEXT NOT NULL,
  source_url TEXT
);
```

### aqi_data table

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
  station_id INT REFERENCES stations(id)
);
```

## 🔌 API Endpoints

### Station APIs

- `GET /stations` - Get all stations with latest readings
- `GET /stations/:id` - Get station details

### AQI APIs

- `GET /aqi/:stationId` - Get latest AQI data for a station
- `GET /aqi/history/:stationId` - Get historical AQI data
- `GET /aqi/station/:stationId` - Get all AQI records for a station
- `GET /aqi/trends/:stationId` - Get time-series data for charts

### Dashboard APIs

- `GET /dashboard/summary` - Get dashboard summary (average PM2.5, highest/lowest stations)

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd AirAware
   ```

2. **Set up the database**
   - Create a PostgreSQL database named `AirAware`
   - Run the SQL commands from the Database Schema section above to create tables

3. **Backend Setup**

   ```bash
   cd Backend
   npm install
   ```

   Create a `.env` file in the Backend directory:

   ```env
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=AirAware
   DB_PASSWORD=your_password
   DB_PORT=5432
   PORT=4000
   ```

4. **Frontend Setup**

   ```bash
   cd ../Frontend
   npm install
   ```

   Create a `.env` file in the Frontend directory (optional):

   ```env
   VITE_API_BASE_URL=http://localhost:4000
   ```

### Running the Application

1. **Start the Backend**

   ```bash
   cd Backend
   npm start
   ```

   The backend will run on http://localhost:4000

2. **Start the Frontend**

   ```bash
   cd Frontend
   npm run dev
   ```

   The frontend will run on http://localhost:5173

3. **Access the Application**
   Open your browser and navigate to http://localhost:5173

## 📱 Usage

### Dashboard

- View all monitoring stations with their latest PM2.5 and PM10 readings
- See overall air quality summary (average, highest, and lowest PM2.5 stations)
- Search stations by name
- Sort stations by name or PM2.5 levels

### Station Details

- Click "View details" on any station card to see comprehensive pollutant data
- View historical trends with interactive line charts
- See all pollutants: PM2.5, PM10, O₃, NO₂, SO₂, CO

### Trends Analysis

- Select any station from the dropdown
- View time-series charts for multiple pollutants
- Analyze air quality patterns over time

## 🎨 Air Quality Color Coding

The application uses EPA-standard color coding for PM2.5 levels:

- 🟢 **Good** (0-12 µg/m³): Green
- 🟡 **Moderate** (12.1-35.4 µg/m³): Yellow
- 🟠 **Unhealthy for Sensitive Groups** (35.5-55.4 µg/m³): Orange
- 🔴 **Unhealthy** (55.5-150.4 µg/m³): Red
- 🟣 **Very Unhealthy** (150.5+ µg/m³): Purple
- ⚪ **Unknown**: Gray

## 🏗 Project Structure

```
AirAware/
├── Backend/
│   ├── controllers/          # Route handlers
│   ├── repositories/         # Database queries
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic
│   ├── middleware/          # Express middleware
│   ├── server.js            # Main server file
│   ├── db.js               # Database connection
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── api.js          # API client functions
│   │   ├── App.jsx         # Main app component
│   │   ├── App.css         # Global styles
│   │   └── main.jsx        # App entry point
│   ├── public/             # Static assets
│   └── package.json
└── README.md
```

## 🔧 Development

### Backend Development

```bash
cd Backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development

```bash
cd Frontend
npm run dev   # Vite dev server with HMR
npm run build # Production build
npm run preview # Preview production build
```

## 📝 API Response Format

All API responses follow a consistent JSON structure:

```json
{
  "stations": [...],
  "station": {...},
  "latest": {...},
  "history": [...],
  "records": [...],
  "trends": [...],
  "summary": {...}
}
```

Error responses:

```json
{
  "error": "Error message description"
}
```

## 🚀 Deployment

### Backend Deployment

1. Set environment variables in your deployment platform
2. Ensure PostgreSQL database is accessible
3. Run `npm start`

### Frontend Deployment

1. Build the frontend: `npm run build`
2. Serve the `dist` folder with any static file server
3. Update `VITE_API_BASE_URL` to point to your deployed backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For questions or issues, please open an issue on the GitHub repository.

---

Built with ❤️ for cleaner air and better health monitoring.
