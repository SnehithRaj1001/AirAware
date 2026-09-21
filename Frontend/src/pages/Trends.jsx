import { useEffect, useMemo, useState } from 'react'
import { fetchStations, fetchAqiTrends } from '../api.js'
import PollutantChart from '../components/PollutantChart.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import './Trends.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const POLLUTANTS = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', color: '#0066ff' },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³', color: '#10b981' },
  { key: 'no2', label: 'NO₂', unit: 'µg/m³', color: '#6366f1' },
  { key: 'nh3', label: 'NH₃', unit: 'µg/m³', color: '#ec4899' },
  { key: 'so2', label: 'SO₂', unit: 'µg/m³', color: '#8b5cf6' },
  { key: 'co', label: 'CO', unit: 'mg/m³', color: '#64748b' },
  { key: 'o3', label: 'Ozone (O₃)', unit: 'µg/m³', color: '#f59e0b' },
];

const Trends = () => {
  const [stations, setStations] = useState([])
  const [selectedStation, setSelectedStation] = useState(null)
  const [trends, setTrends] = useState([])
  const [forecast, setForecast] = useState([])
  const [activeTab, setActiveTab] = useState('history') // 'history' or 'forecast'
  const [forecastDays, setForecastDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Training Progress States
  const [isTraining, setIsTraining] = useState(false)
  const [progress, setProgress] = useState(0)
  const [trainingMessage, setTrainingMessage] = useState('')

  useEffect(() => {
    const loadStations = async () => {
      try {
        const payload = await fetchStations()
        setStations(payload.stations)
        if (payload.stations.length > 0) {
          setSelectedStation(payload.stations[0].station_id)
        }
      } catch (err) {
        setError(err.message)
      }
    }
    loadStations()
  }, [])

  useEffect(() => {
    if (!selectedStation) return

    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        if (activeTab === 'history') {
          const payload = await fetchAqiTrends(selectedStation)
          setTrends(
            payload.trends.map((item) => ({
              ...item,
              date: new Date(item.date).toLocaleDateString(),
            })),
          )
          setLoading(false)
        } else {
          // Use Streaming Forecast
          startStreamingForecast(selectedStation)
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message)
        setLoading(false)
      }
    }

    loadData()
  }, [selectedStation, activeTab])

  const startStreamingForecast = (stationId) => {
    setIsTraining(true)
    setProgress(0)
    setTrainingMessage('Connecting to AI service...')
    
    const token = localStorage.getItem('authToken')
    const url = `${API_BASE_URL}/stations/${stationId}/forecast/stream`
    
    const fetchStream = async () => {
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) throw new Error('Failed to connect to forecast stream')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop()

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.replace('data: ', ''))
              
              if (data.status === 'training') {
                setIsTraining(true)
                setProgress(data.progress)
                setTrainingMessage(data.currentTask || data.message)
              } else if (data.status === 'loading' || data.status === 'forecasting') {
                setProgress(data.progress)
                setTrainingMessage(data.message)
              } else if (data.status === 'done') {
                setForecast(data.forecast)
                setIsTraining(false)
                setLoading(false)
              } else if (data.status === 'error') {
                setError(data.message)
                setIsTraining(false)
                setLoading(false)
              }
            }
          }
        }
      } catch (err) {
        setError(err.message)
        setIsTraining(false)
        setLoading(false)
      }
    }

    fetchStream()
  }

  const stationName = useMemo(() => {
    const station = stations.find((item) => item.station_id === Number(selectedStation))
    return station?.station_name || 'Station'
  }, [stations, selectedStation])

  const filteredForecast = useMemo(() => {
    return forecast.slice(0, forecastDays)
  }, [forecast, forecastDays])

  const activeData = useMemo(() => {
    const rawData = activeTab === 'history' ? trends : filteredForecast;
    return rawData.map(item => ({
      ...item,
      o3: item.o3 ?? item.ozone,
    }));
  }, [activeTab, trends, filteredForecast]);

  return (
    <main className="page-shell">
      <div className="section-header">
        <div>
          <h1>Analysis & Forecasting</h1>
          <p>Explore historical trends and ML-powered predictions.</p>
        </div>
      </div>

      <div className="controls-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className="control-block">
          <label htmlFor="station-select">Choose station</label>
          <select
            id="station-select"
            value={selectedStation ?? ''}
            onChange={(e) => setSelectedStation(e.target.value)}
          >
            {stations.map((station) => (
              <option key={station.station_id} value={station.station_id}>
                {station.station_name}
              </option>
            ))}
          </select>
        </div>

        <div className="tab-controls">
          <button 
            onClick={() => setActiveTab('history')}
            className={`tab-btn ${activeTab === 'history' ? 'tab-active' : ''}`}
          >
            Historical Trends
          </button>
          <button 
            onClick={() => setActiveTab('forecast')}
            className={`tab-btn ${activeTab === 'forecast' ? 'tab-active' : ''}`}
          >
            AI Forecast
          </button>
        </div>
      </div>

      {activeTab === 'forecast' && (
        <div className="duration-selector-row">
          <span className="duration-label">Forecast Duration:</span>
          {[3, 7, 14].map(d => (
            <button
              key={d}
              onClick={() => setForecastDays(d)}
              className={`duration-btn ${forecastDays === d ? 'duration-active' : ''}`}
            >
              {d} Days
            </button>
          ))}
        </div>
      )}

      {error ? <div className="error-box">{error}</div> : null}

      {activeTab === 'forecast' && isTraining && (
        <div className="training-panel">
          <ProgressBar progress={progress} status={progress < 100 ? 'training' : 'complete'} message={trainingMessage} />
        </div>
      )}

      {activeTab === 'forecast' && !isTraining && filteredForecast.length > 0 && (
        <section className="forecast-table-panel">
          <h3>{forecastDays}-Day Exact Predictions</h3>
          <div className="forecast-table-scroll">
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>PM2.5</th>
                  <th>PM10</th>
                  <th>NO2</th>
                  <th>NH3</th>
                  <th>SO2</th>
                  <th>CO</th>
                  <th>Ozone</th>
                  <th>Predicted AQI</th>
                </tr>
              </thead>
              <tbody>
                {filteredForecast.map((row, idx) => {
                  const pollutantKeys = ['pm25', 'pm10', 'no2', 'nh3', 'so2', 'co', 'ozone'];
                  const dayAqi = Math.round(Math.max(...pollutantKeys.map(k => Number(row[k]) || 0))) || 0;
                  
                  return (
                    <tr key={idx}>
                      <td>{row.date}</td>
                      <td>
                        <span className={`pollutant-badge ${row.pm25 > 100 ? 'pollutant-badge-bad' : 'pollutant-badge-good'}`}>
                          {row.pm25}
                        </span>
                      </td>
                      <td>{row.pm10}</td>
                      <td>{row.no2}</td>
                      <td>{row.nh3}</td>
                      <td>{row.so2}</td>
                      <td>{row.co}</td>
                      <td>{row.ozone}</td>
                      <td>
                        <span 
                          className="aqi-badge-cell"
                          style={{ background: dayAqi > 100 ? '#ef4444' : '#22c55e' }}
                        >
                          {Math.round(dayAqi)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="chart-panel" style={{ position: 'relative', minHeight: '400px' }}>
        {loading && !isTraining && (
          <div className="chart-loading-overlay">
             <div className="spinner"></div>
          </div>
        )}
        <div className="panel-heading">
          <h2>{stationName} {activeTab === 'forecast' ? `(${forecastDays}-Day AI Forecast)` : '(Historical)'}</h2>
          <p>{activeTab === 'forecast' 
            ? `Predicted pollutant levels for the next ${forecastDays} days based on XGBoost model, separated by parameter.` 
            : 'Historical air quality data for the selected measurement station, separated by parameter.'}
          </p>
        </div>

        {POLLUTANTS.map((p) => (
          <div key={p.key} className="chart-group">
            <div className="chart-group-label">
              <span className="chart-group-dot" style={{ background: p.color }}></span>
              <h4>{p.label}</h4>
              <span className="chart-group-unit">{p.unit}</span>
            </div>
            <PollutantChart 
              data={activeData} 
              pollutants={[p.key]} 
              height={260}
            />
          </div>
        ))}
      </section>
    </main>
  )
}

export default Trends
