import { useEffect, useMemo, useState } from 'react'
import { fetchStations, fetchAqiTrends } from '../api.js'
import PollutantChart from '../components/PollutantChart.jsx'

const Trends = () => {
  const [stations, setStations] = useState([])
  const [selectedStation, setSelectedStation] = useState(null)
  const [trends, setTrends] = useState([])
  const [error, setError] = useState(null)

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

    const loadTrends = async () => {
      try {
        const payload = await fetchAqiTrends(selectedStation)
        setTrends(
          payload.trends.map((item) => ({
            ...item,
            date: new Date(item.date).toLocaleDateString(),
          })),
        )
      } catch (err) {
        setError(err.message)
      }
    }

    loadTrends()
  }, [selectedStation])

  const stationName = useMemo(() => {
    const station = stations.find((item) => item.station_id === Number(selectedStation))
    return station?.station_name || 'Station'
  }, [stations, selectedStation])

  return (
    <main className="page-shell">
      <div className="section-header">
        <div>
          <h1>Trend analysis</h1>
          <p>Explore pollutant levels over time with a station selector.</p>
        </div>
      </div>

      <div className="controls-row">
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

      {error ? <div className="error-box">{error}</div> : null}

      <section className="chart-panel">
        <div className="panel-heading">
          <h2>{stationName}</h2>
          <p>Air quality trend data for the selected measurement station.</p>
        </div>
        <PollutantChart data={trends} pollutants={['pm25', 'pm10', 'o3', 'no2']} />
      </section>
    </main>
  )
}

export default Trends
