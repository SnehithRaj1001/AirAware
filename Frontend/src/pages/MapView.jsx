import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { publicAPI } from '../api.js';
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

const MapView = () => {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadStations = async () => {
            try {
                setLoading(true);
                const response = await publicAPI.getAllStations();
                // Filter stations that have lat/long
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
        if (aqi <= 50) return { label: 'Good', color: '#22c55e' };
        if (aqi <= 100) return { label: 'Satisfactory', color: '#f59e0b' };
        if (aqi <= 200) return { label: 'Moderate', color: '#ef4444' };
        return { label: 'Poor', color: '#7f1d1d' };
    };

    if (loading) return <div className="page-shell"><div className="spinner"></div></div>;
    if (error) return <div className="page-shell"><div className="error-box">{error}</div></div>;

    return (
        <main className="page-shell map-page">
            <section className="hero-panel">
                <div>
                    <h1>Interactive Station Map</h1>
                    <p>Explore air quality monitoring stations across the region geographically.</p>
                </div>
            </section>

            <div className="map-container-wrapper">
                <MapContainer 
                    center={[20.5937, 78.9629]} 
                    zoom={5} 
                    style={{ height: '600px', width: '100%', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {stations.map((station) => {
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
                                        <a href={`/station/${station.id}`} className="view-details-link">
                                            View Full Analysis →
                                        </a>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
        </main>
    );
};

export default MapView;
