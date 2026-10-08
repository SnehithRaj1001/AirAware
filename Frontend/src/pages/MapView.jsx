import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import { publicAPI } from '../api.js';
import { MapSkeleton } from '../components/Skeleton.jsx';
import './MapView.css';

// Fix for default marker icons in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Continuous, smooth fluid heatmap overlay
const HeatmapLayer = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !points || points.length === 0 || !L.heatLayer) return;

        // Leaflet HeatLayer config with smooth blending transitions
        const heat = L.heatLayer(points, {
            radius: 45,
            blur: 35,
            maxZoom: 14,
            max: 350,
            minOpacity: 0.25,
            gradient: {
                0.15: '#10b981', // Good (Green)
                0.30: '#84cc16', // Satisfactory (Lime)
                0.50: '#f59e0b', // Moderate (Amber)
                0.70: '#f97316', // Poor (Orange)
                0.85: '#ef4444', // Very Poor (Red)
                1.00: '#7f1d1d'  // Severe (Dark Red)
            }
        }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [map, points]);

    return null;
};

const MapView = () => {
    const [stations, setStations] = useState([]);
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showMarkers, setShowMarkers] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadStations = async () => {
            try {
                setLoading(true);
                const response = await publicAPI.getAllStations();
                const validStations = response.data.filter(s => s.latitude && s.longitude);
                setStations(validStations);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadStations();
    }, []);

    const getAqiStatus = (aqi) => {
        if (!aqi) return { label: 'Unknown', color: '#94a3b8' };
        if (aqi <= 50) return { label: 'Good', color: '#10b981' };
        if (aqi <= 100) return { label: 'Satisfactory', color: '#84cc16' };
        if (aqi <= 200) return { label: 'Moderate', color: '#f59e0b' };
        if (aqi <= 300) return { label: 'Poor', color: '#f97316' };
        if (aqi <= 400) return { label: 'Very Poor', color: '#ef4444' };
        return { label: 'Severe', color: '#991b1b' };
    };

    const heatmapPoints = stations
        .map((station) => {
            const aqi = Math.round(Math.max(
                station.latestAqi?.pm25 || 0,
                station.latestAqi?.pm10 || 0,
                station.latestAqi?.no2 || 0,
                station.latestAqi?.so2 || 0,
                station.latestAqi?.co || 0,
                station.latestAqi?.o3 || 0
            ));
            if (!aqi || !station.latitude || !station.longitude) return null;
            return [station.latitude, station.longitude, aqi];
        })
        .filter(Boolean);

    if (loading) return <MapSkeleton />;
    if (error) return <div className="page-shell"><div className="error-box">{error}</div></div>;

    return (
        <main className="page-shell map-page">
            <section className="hero-panel map-header-panel">
                <div>
                    <h1>Interactive Station Map</h1>
                    <p>Explore air quality monitoring stations across the region geographically.</p>
                </div>
                <div className="map-view-controls">
                    <label className="map-toggle-btn">
                        <input 
                            type="checkbox" 
                            checked={showHeatmap} 
                            onChange={(e) => setShowHeatmap(e.target.checked)} 
                        />
                        <span>🔥 Fluid AQI Heatmap</span>
                    </label>
                    <label className="map-toggle-btn">
                        <input 
                            type="checkbox" 
                            checked={showMarkers} 
                            onChange={(e) => setShowMarkers(e.target.checked)} 
                        />
                        <span>📍 Station Pins</span>
                    </label>
                </div>
            </section>

            <div className="map-container-wrapper">
                <MapContainer 
                    center={[20.5937, 78.9629]} 
                    zoom={5} 
                    className="map-dark-tiles"
                    style={{ height: '620px', width: '100%', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Fluid, continuous interpolated heatmap layer */}
                    {showHeatmap && <HeatmapLayer points={heatmapPoints} />}
                    {showMarkers && stations.map((station) => {
                        const aqi = Math.round(Math.max(
                            station.latestAqi?.pm25 || 0,
                            station.latestAqi?.pm10 || 0,
                            station.latestAqi?.no2 || 0,
                            station.latestAqi?.so2 || 0,
                            station.latestAqi?.co || 0,
                            station.latestAqi?.o3 || 0
                        ));
                        const status = getAqiStatus(aqi);

                        return (
                            <Marker 
                                key={station.id} 
                                position={[station.latitude, station.longitude]}
                            >
                                <Tooltip direction="top" offset={[0, -32]} opacity={1}>
                                    <div className="map-tooltip">
                                        <strong>{station.stationName}</strong>
                                        <div style={{ color: status.color, fontWeight: 700 }}>AQI: {aqi || 'N/A'} ({status.label})</div>
                                    </div>
                                </Tooltip>
                                <Popup>
                                    <div className="map-popup-card">
                                        <h3>{station.stationName}</h3>
                                        <p className="address">{station.address || 'Address not available'}</p>
                                        <div className="aqi-badge" style={{ background: status.color }}>
                                            AQI {aqi || 'N/A'}
                                        </div>
                                        <div className="pollutants-grid">
                                            <div className="pollutant-item">
                                                <span>PM2.5</span>
                                                <strong>{station.latestAqi?.pm25 || 'N/A'}</strong>
                                            </div>
                                            <div className="pollutant-item">
                                                <span>PM10</span>
                                                <strong>{station.latestAqi?.pm10 || 'N/A'}</strong>
                                            </div>
                                        </div>
                                        <Link to={`/station/${station.id}`} className="view-details-link">
                                            View Full Analysis →
                                        </Link>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

                {/* Heatmap Legend */}
                {showHeatmap && (
                    <div className="map-heatmap-legend">
                        <span className="legend-title">AQI Heat Intensity:</span>
                        <div className="legend-scale">
                            <span className="legend-chip" style={{ background: '#10b981' }}>0-50 Good</span>
                            <span className="legend-chip" style={{ background: '#84cc16' }}>51-100 Satisfactory</span>
                            <span className="legend-chip" style={{ background: '#f59e0b' }}>101-200 Moderate</span>
                            <span className="legend-chip" style={{ background: '#f97316' }}>201-300 Poor</span>
                            <span className="legend-chip" style={{ background: '#ef4444' }}>301-400 Very Poor</span>
                            <span className="legend-chip" style={{ background: '#991b1b' }}>401+ Severe</span>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default MapView;
