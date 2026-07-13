import { useEffect, useMemo, useState } from 'react'
import { fetchStations, fetchAqiTrends } from '../api.js'
import PollutantChart from '../components/PollutantChart.jsx'
import ProgressBar from '../components/ProgressBar.jsx'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

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
    // We'll use a standard EventSource if possible, or fetch.
    // For simplicity in this environment, let's use the native EventSource with token in query param
    // (Ensure backend handles this or use fetch with headers)
    
    // Alternative: Use fetch with ReadableStream for headers support
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

        <div className="tab-controls" style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button 
            onClick={() => setActiveTab('history')}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '6px', 
              border: 'none', 
              background: activeTab === 'history' ? '#fff' : 'transparent',
              boxShadow: activeTab === 'history' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              color: activeTab === 'history' ? 'var(--accent)' : 'var(--text-muted)'
            }}
          >
            Historical Trends
          </button>
          <button 
            onClick={() => setActiveTab('forecast')}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '6px', 
              border: 'none', 
              background: activeTab === 'forecast' ? '#fff' : 'transparent',
              boxShadow: activeTab === 'forecast' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              color: activeTab === 'forecast' ? 'var(--accent)' : 'var(--text-muted)'
            }}
          >
            AI Forecast
          </button>
        </div>
      </div>

      {activeTab === 'forecast' && (
        <div className="duration-selector-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', background: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Forecast Duration:</span>
          {[3, 7, 14].map(d => (
            <button
              key={d}
              onClick={() => setForecastDays(d)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: forecastDays === d ? 'var(--accent)' : '#e2e8f0',
                background: forecastDays === d ? 'var(--accent-light)' : '#fff',
                color: forecastDays === d ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {d} Days
            </button>
          ))}
        </div>
      )}

      {error ? <div className="error-box">{error}</div> : null}

      {activeTab === 'forecast' && isTraining && (
        <div className="training-panel" style={{ background: '#fff', padding: '40px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', marginBottom: '24px', textAlign: 'center' }}>
          <ProgressBar progress={progress} status={progress < 100 ? 'training' : 'complete'} message={trainingMessage} />
        </div>
      )}

      {activeTab === 'forecast' && !isTraining && filteredForecast.length > 0 && (
        <section className="forecast-table-panel" style={{ marginBottom: '24px', background: '#fff', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 700 }}>{forecastDays}-Day Exact Predictions</h3>
          <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>PM2.5</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>PM10</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>NO2</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>NH3</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>SO2</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>CO</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Ozone</th>
                  <th style={{ padding: '12px 8px', color: 'var(--primary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800 }}>Predicted AQI</th>
                </tr>
              </thead>
              <tbody>
                {filteredForecast.map((row, idx) => {
                  const pollutantKeys = ['pm25', 'pm10', 'no2', 'nh3', 'so2', 'co', 'ozone'];
                  const dayAqi = Math.round(Math.max(...pollutantKeys.map(k => Number(row[k]) || 0))) || 0;
                  
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 8px', fontWeight: 700, color: 'var(--primary)' }}>{row.date}</td>
                      <td style={{ padding: '16px 8px' }}>
                        <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', background: row.pm25 > 100 ? '#fef2f2' : '#f0fdf4', color: row.pm25 > 100 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                          {row.pm25}
                        </span>
                      </td>
                      <td style={{ padding: '16px 8px', fontWeight: 500 }}>{row.pm10}</td>
                      <td style={{ padding: '16px 8px', fontWeight: 500 }}>{row.no2}</td>
                      <td style={{ padding: '16px 8px', fontWeight: 500 }}>{row.nh3}</td>
                      <td style={{ padding: '16px 8px', fontWeight: 500 }}>{row.so2}</td>
                      <td style={{ padding: '16px 8px', fontWeight: 500 }}>{row.co}</td>
                      <td style={{ padding: '16px 8px', fontWeight: 500 }}>{row.ozone}</td>
                      <td style={{ padding: '16px 8px' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          background: dayAqi > 100 ? '#ef4444' : '#22c55e', 
                          color: '#fff', 
                          fontWeight: 800,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                        }}>
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
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 'var(--radius-lg)' }}>
             <div className="spinner"></div>
          </div>
        )}
        <div className="panel-heading">
          <h2>{stationName} {activeTab === 'forecast' ? `(${forecastDays}-Day AI Forecast)` : '(Historical)'}</h2>
          <p>{activeTab === 'forecast' 
            ? `Predicted pollutant levels for the next ${forecastDays} days based on XGBoost model.` 
            : 'Historical air quality data for the selected measurement station.'}
          </p>
        </div>
        <PollutantChart 
          data={activeTab === 'history' ? trends : filteredForecast} 
          pollutants={['pm25', 'pm10', 'no2', 'nh3', 'so2', 'co', 'o3']} 
        />
      </section>
    </main>
  )
}

export default Trends
