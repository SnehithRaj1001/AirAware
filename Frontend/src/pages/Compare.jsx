import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';
import { fetchStations, fetchStationComparison, fetchCityComparison } from '../api.js';
import { Skeleton } from '../components/Skeleton.jsx';
import { getIndianAqiColor, getIndianAqiBand } from '../utils/aqiStandards.js';
import './Compare.css';

const ENTITY_COLORS = [
  '#0066ff', // Electric Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
];

const POLLUTANTS = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³' },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³' },
  { key: 'no2', label: 'NO₂', unit: 'µg/m³' },
  { key: 'so2', label: 'SO₂', unit: 'µg/m³' },
  { key: 'co', label: 'CO', unit: 'mg/m³' },
  { key: 'ozone', label: 'Ozone', unit: 'µg/m³' },
  { key: 'nh3', label: 'NH₃', unit: 'µg/m³' },
];

const getAqiColor = (val) => getIndianAqiColor(val);


export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Mode: 'station' | 'city'
  const [mode, setMode] = useState(() => searchParams.get('mode') || 'station');
  
  // Metadata
  const [allStations, setAllStations] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  
  // Selection
  const [selectedStationIds, setSelectedStationIds] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  
  // Controls
  const [activePollutant, setActivePollutant] = useState('pm25');
  const [timeframeDays, setTimeframeDays] = useState(30);
  
  // Data
  const [comparisonData, setComparisonData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);

  // Helper to extract clean city name
  const extractCity = (st) => {
    if (st.city && st.city.trim()) return st.city.trim();
    const parts = (st.station_name || '').split(',');
    if (parts.length > 1) {
      const second = parts[1].trim().split('-')[0].trim();
      if (second) return second;
    }
    return 'Other';
  };

  // Load all stations on mount
  useEffect(() => {
    const loadInit = async () => {
      try {
        setLoadingMeta(true);
        const data = await fetchStations();
        const list = data.stations || [];
        setAllStations(list);

        // Pre-fill initial selection from query or first items
        const qStation = searchParams.get('stationIds');
        const qCity = searchParams.get('cities');

        if (qStation) {
          const ids = qStation.split(',').map(Number).filter(Boolean);
          setSelectedStationIds(ids);
        } else if (list.length >= 2) {
          // Default pick first 2 stations
          setSelectedStationIds([list[0].station_id, list[1].station_id]);
        }

        if (qCity) {
          const cList = qCity.split(',').filter(Boolean);
          setSelectedCities(cList);
        } else {
          // Pick top 2 cities
          const citySet = new Set(list.map(extractCity).filter(c => c !== 'Other'));
          const topCities = Array.from(citySet).slice(0, 2);
          setSelectedCities(topCities);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingMeta(false);
      }
    };
    loadInit();
  }, []);

  // Sorted unique cities list
  const availableCities = useMemo(() => {
    const set = new Set();
    allStations.forEach(s => set.add(extractCity(s)));
    return Array.from(set).sort();
  }, [allStations]);

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('mode', mode);
    if (mode === 'station' && selectedStationIds.length > 0) {
      params.set('stationIds', selectedStationIds.join(','));
    } else if (mode === 'city' && selectedCities.length > 0) {
      params.set('cities', selectedCities.join(','));
    }
    setSearchParams(params, { replace: true });
  }, [mode, selectedStationIds, selectedCities]);

  // Fetch comparison data when selections or timeframe change
  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      if (mode === 'station') {
        if (selectedStationIds.length === 0) {
          setComparisonData([]);
          return;
        }
        setLoadingData(true);
        try {
          const res = await fetchStationComparison(selectedStationIds, timeframeDays);
          setComparisonData(res.trends || []);
        } catch (err) {
          setError(err.response?.data?.error || err.message);
        } finally {
          setLoadingData(false);
        }
      } else {
        if (selectedCities.length === 0) {
          setComparisonData([]);
          return;
        }
        setLoadingData(true);
        try {
          const res = await fetchCityComparison(selectedCities, timeframeDays);
          setComparisonData(res.trends || []);
        } catch (err) {
          setError(err.response?.data?.error || err.message);
        } finally {
          setLoadingData(false);
        }
      }
    };

    fetchData();
  }, [mode, selectedStationIds, selectedCities, timeframeDays]);

  // Handlers for Adding / Removing items
  const handleAddStation = (stationId) => {
    const num = Number(stationId);
    if (!num || selectedStationIds.includes(num)) return;
    if (selectedStationIds.length >= 6) {
      alert('You can compare up to 6 stations simultaneously.');
      return;
    }
    setSelectedStationIds(prev => [...prev, num]);
  };

  const handleRemoveStation = (stationId) => {
    setSelectedStationIds(prev => prev.filter(id => id !== stationId));
  };

  const handleAddCity = (cityName) => {
    if (!cityName || selectedCities.includes(cityName)) return;
    if (selectedCities.length >= 6) {
      alert('You can compare up to 6 cities simultaneously.');
      return;
    }
    setSelectedCities(prev => [...prev, cityName]);
  };

  const handleRemoveCity = (cityName) => {
    setSelectedCities(prev => prev.filter(c => c !== cityName));
  };

  // Build pivot chart data: { date: 'YYYY-MM-DD', [entityName]: val, ... }
  const { chartData, entityKeys, entityColorMap } = useMemo(() => {
    const dateMap = {};
    const keys = [];
    const colorMap = {};

    if (mode === 'station') {
      selectedStationIds.forEach((id, idx) => {
        const found = allStations.find(s => s.station_id === id);
        const name = found ? found.station_name : `Station ${id}`;
        keys.push(name);
        colorMap[name] = ENTITY_COLORS[idx % ENTITY_COLORS.length];
      });

      comparisonData.forEach(row => {
        const dStr = new Date(row.date).toISOString().split('T')[0];
        if (!dateMap[dStr]) dateMap[dStr] = { date: dStr };
        const val = row[activePollutant] != null ? Number(row[activePollutant]) : null;
        dateMap[dStr][row.station_name] = val;
      });
    } else {
      selectedCities.forEach((city, idx) => {
        keys.push(city);
        colorMap[city] = ENTITY_COLORS[idx % ENTITY_COLORS.length];
      });

      comparisonData.forEach(row => {
        const dStr = new Date(row.date).toISOString().split('T')[0];
        if (!dateMap[dStr]) dateMap[dStr] = { date: dStr };
        const val = row[activePollutant] != null ? Number(row[activePollutant]) : null;
        dateMap[dStr][row.city] = val;
      });
    }

    const sortedList = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    return { chartData: sortedList, entityKeys: keys, entityColorMap: colorMap };
  }, [comparisonData, mode, selectedStationIds, selectedCities, allStations, activePollutant]);

  // Aggregate scorecard stats per entity
  const summaryStats = useMemo(() => {
    return entityKeys.map(entityName => {
      let matchingRows = [];
      if (mode === 'station') {
        matchingRows = comparisonData.filter(r => r.station_name === entityName);
      } else {
        matchingRows = comparisonData.filter(r => r.city === entityName);
      }

      const count = matchingRows.length;
      if (count === 0) {
        return {
          name: entityName,
          avgPollutant: null,
          maxPollutant: null,
          latestPollutant: null,
          avgPm25: null,
          color: entityColorMap[entityName],
        };
      }

      let sumPollutant = 0;
      let validCount = 0;
      let maxPollutant = -1;
      let sumPm25 = 0;
      let pm25Count = 0;

      matchingRows.forEach(r => {
        const v = r[activePollutant] != null ? Number(r[activePollutant]) : null;
        if (v != null) {
          sumPollutant += v;
          validCount++;
          if (v > maxPollutant) maxPollutant = v;
        }
        if (r.pm25 != null) {
          sumPm25 += Number(r.pm25);
          pm25Count++;
        }
      });

      const latestRow = matchingRows[matchingRows.length - 1];
      const latestVal = latestRow && latestRow[activePollutant] != null ? Number(latestRow[activePollutant]) : null;

      return {
        name: entityName,
        avgPollutant: validCount > 0 ? (sumPollutant / validCount).toFixed(1) : 'N/A',
        maxPollutant: maxPollutant >= 0 ? maxPollutant.toFixed(1) : 'N/A',
        latestPollutant: latestVal != null ? latestVal.toFixed(1) : 'N/A',
        avgPm25: pm25Count > 0 ? Math.round(sumPm25 / pm25Count) : null,
        color: entityColorMap[entityName],
      };
    });
  }, [entityKeys, comparisonData, mode, activePollutant, entityColorMap]);

  return (
    <main className="compare-shell">
      {/* Header Row */}
      <div className="compare-header-row">
        <div>
          <h1>Comparative Air Quality Analytics</h1>
          <p>Direct side-by-side pollutant benchmarking across monitoring stations or metropolitan areas.</p>
        </div>

        {/* Mode Toggle */}
        <div className="compare-mode-toggle">
          <button
            type="button"
            className={`mode-btn ${mode === 'station' ? 'mode-active' : ''}`}
            onClick={() => setMode('station')}
          >
            🏢 Station Compare
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'city' ? 'mode-active' : ''}`}
            onClick={() => setMode('city')}
          >
            🌆 City Compare
          </button>
        </div>
      </div>

      {/* Selector Card */}
      <section className="compare-selector-card">
        <div className="selector-grid">
          {mode === 'station' ? (
            <div className="selector-block">
              <label htmlFor="station-picker">➕ Add Monitoring Station to Compare</label>
              <select
                id="station-picker"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddStation(e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="" disabled>Select a station to add...</option>
                {allStations
                  .filter(s => !selectedStationIds.includes(s.station_id))
                  .map(s => (
                    <option key={s.station_id} value={s.station_id}>
                      {s.station_name} ({extractCity(s)})
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="selector-block">
              <label htmlFor="city-picker">➕ Add City / District to Compare</label>
              <select
                id="city-picker"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddCity(e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="" disabled>Select a city to add...</option>
                {availableCities
                  .filter(c => !selectedCities.includes(c))
                  .map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="selector-block" style={{ maxWidth: '240px' }}>
            <label>⏱️ Historical Window</label>
            <div className="timeframe-chips">
              {[7, 14, 30, 90].map(days => (
                <button
                  key={days}
                  type="button"
                  className={`timeframe-btn ${timeframeDays === days ? 'timeframe-active' : ''}`}
                  onClick={() => setTimeframeDays(days)}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Entity Badges */}
        <div className="selected-entities-wrap">
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Comparing ({mode === 'station' ? selectedStationIds.length : selectedCities.length}):
          </span>

          {mode === 'station' ? (
            selectedStationIds.length === 0 ? (
              <span className="hint-text">No stations selected. Add one from the dropdown above.</span>
            ) : (
              selectedStationIds.map((id, idx) => {
                const st = allStations.find(s => s.station_id === id);
                const color = ENTITY_COLORS[idx % ENTITY_COLORS.length];
                return (
                  <span
                    key={id}
                    className="selected-badge"
                    style={{ borderColor: `${color}60`, color }}
                  >
                    <span className="badge-dot" style={{ background: color }}></span>
                    {st ? st.station_name : `Station ${id}`}
                    <button
                      type="button"
                      title="Remove"
                      onClick={() => handleRemoveStation(id)}
                    >
                      ✕
                    </button>
                  </span>
                );
              })
            )
          ) : (
            selectedCities.length === 0 ? (
              <span className="hint-text">No cities selected. Add one from the dropdown above.</span>
            ) : (
              selectedCities.map((city, idx) => {
                const color = ENTITY_COLORS[idx % ENTITY_COLORS.length];
                return (
                  <span
                    key={city}
                    className="selected-badge"
                    style={{ borderColor: `${color}60`, color }}
                  >
                    <span className="badge-dot" style={{ background: color }}></span>
                    {city}
                    <button
                      type="button"
                      title="Remove"
                      onClick={() => handleRemoveCity(city)}
                    >
                      ✕
                    </button>
                  </span>
                );
              })
            )
          )}
        </div>
      </section>

      {error && <div className="error-box" style={{ marginBottom: '24px' }}>{error}</div>}

      {/* Scorecards Row */}
      {loadingData ? (
        <div className="scorecards-grid">
          <Skeleton height="160px" borderRadius="12px" />
          <Skeleton height="160px" borderRadius="12px" />
        </div>
      ) : summaryStats.length > 0 ? (
        <div className="scorecards-grid">
          {summaryStats.map((stat, idx) => {
            const activePollutantObj = POLLUTANTS.find(p => p.key === activePollutant);
            return (
              <div key={idx} className="entity-scorecard">
                <div className="scorecard-top-bar" style={{ background: stat.color }}></div>
                <div className="scorecard-header">
                  <div>
                    <h3 title={stat.name}>{stat.name}</h3>
                    <span className="scorecard-sub">{mode === 'station' ? 'Monitoring Station' : 'Metropolitan Average'}</span>
                  </div>
                  {stat.avgPm25 != null && (
                    <div
                      className="scorecard-aqi-pill"
                      style={{ background: getAqiColor(stat.avgPm25) }}
                      title="Average AQI equivalent (PM2.5 based)"
                    >
                      {stat.avgPm25}
                    </div>
                  )}
                </div>

                <div className="scorecard-metrics">
                  <div className="metric-item">
                    <span className="metric-label">Latest</span>
                    <span className="metric-val">
                      {stat.latestPollutant} <small style={{ fontSize: '10px' }}>{activePollutantObj?.unit}</small>
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">{timeframeDays}d Avg</span>
                    <span className="metric-val">
                      {stat.avgPollutant} <small style={{ fontSize: '10px' }}>{activePollutantObj?.unit}</small>
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Peak</span>
                    <span className="metric-val" style={{ color: stat.maxPollutant > 100 ? '#ef4444' : 'inherit' }}>
                      {stat.maxPollutant} <small style={{ fontSize: '10px' }}>{activePollutantObj?.unit}</small>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Comparative Chart Panel */}
      <section className="compare-charts-section">
        <div className="chart-header-controls">
          <div>
            <h2>Comparative Trajectory</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
              Select a pollutant metric to view superimposed time-series trajectories.
            </p>
          </div>

          <div className="pollutant-chips">
            {POLLUTANTS.map(p => (
              <button
                key={p.key}
                type="button"
                className={`pollutant-chip-btn ${activePollutant === p.key ? 'chip-active' : ''}`}
                onClick={() => setActivePollutant(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loadingData ? (
          <div style={{ padding: '24px 0' }}>
            <Skeleton height="380px" borderRadius="12px" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="empty-compare-state">
            <h3>No telemetry data available for the chosen selection</h3>
            <p>Try selecting other stations/cities or increasing the historical window.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: '420px', marginTop: '12px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  domain={[0, (dataMax) => {
                    if (!dataMax || dataMax === 0) return 10;
                    return Math.ceil(dataMax * 1.15);
                  }]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-md)',
                    color: 'var(--text-main)',
                  }}
                  itemStyle={{ fontSize: 13, fontWeight: 600 }}
                  formatter={(value, name) => [
                    `${value ?? 'N/A'} ${POLLUTANTS.find(p => p.key === activePollutant)?.unit || ''}`,
                    name
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  height={40}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}
                />
                {entityKeys.map((name) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    name={name}
                    stroke={entityColorMap[name] || '#0066ff'}
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 1, fill: entityColorMap[name] }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Summary Ranking Table */}
      {!loadingData && summaryStats.length > 0 && (
        <section className="ranking-table-panel">
          <h3>🏆 Proximity & Pollution Performance Matrix</h3>
          <div className="table-responsive">
            <table className="compare-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>{mode === 'station' ? 'Station Name' : 'City / District'}</th>
                  <th>Latest {POLLUTANTS.find(p => p.key === activePollutant)?.label}</th>
                  <th>{timeframeDays}d Average</th>
                  <th>Peak Level</th>
                  <th>AQI Health Category</th>
                </tr>
              </thead>
              <tbody>
                {[...summaryStats]
                  .sort((a, b) => (Number(a.avgPollutant) || 999) - (Number(b.avgPollutant) || 999))
                  .map((row, idx) => {
                    const avgNum = Number(row.avgPollutant);
                    const band = getIndianAqiBand(row.avgPm25 ?? avgNum);
                    return (
                      <tr key={row.name}>
                        <td>
                          <span className={`rank-badge ${idx === 0 ? 'rank-1' : ''}`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td>
                          <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge-dot" style={{ background: row.color }}></span>
                            {row.name}
                          </strong>
                        </td>
                        <td>{row.latestPollutant}</td>
                        <td><strong>{row.avgPollutant}</strong></td>
                        <td>{row.maxPollutant}</td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: band.bg,
                              color: band.color,
                              border: `1px solid ${band.border}`
                            }}
                          >
                            {band.label}
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
    </main>
  );
}
