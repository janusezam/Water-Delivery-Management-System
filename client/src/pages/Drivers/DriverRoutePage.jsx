import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import axios from 'axios';

// Custom Icons
const DriverIcon = L.divIcon({
    className: 'driver-live-icon',
    html: `<div style="background: #4F46E5; color: white; padding: 8px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4); display: flex; align-items: center; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5-5 18-2-9-9-2Z"/></svg>
           </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
});

const DefaultIcon = L.divIcon({
    className: 'customer-icon',
    html: `<div style="background: #F59E0B; color: white; padding: 8px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
           </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
});

const ActiveIcon = L.divIcon({
    className: 'customer-active-icon',
    html: `<div style="background: #10B981; color: white; padding: 8px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 12px rgba(16,185,129,0.4); display: flex; align-items: center; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
           </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
});

// Distance Calculation (Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
};

// Routing Component
const RoutingMachine = ({ driverLocation, nextStopLocation }) => {
    const map = useMap();

    useEffect(() => {
        if (!driverLocation || !nextStopLocation) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(driverLocation[0], driverLocation[1]),
                L.latLng(nextStopLocation[0], nextStopLocation[1])
            ],
            lineOptions: {
                styles: [{ color: '#4F46E5', weight: 5, opacity: 0.8 }]
            },
            routeWhileDragging: false,
            addWaypoints: false,
            fitSelectedRoutes: true,
            showAlternatives: false,
            show: false, // Hides the step-by-step itinerary
            createMarker: () => null // Hide routing machine default markers
        }).addTo(map);

        return () => {
            if (map && routingControl) {
                map.removeControl(routingControl);
            }
        };
    }, [map, driverLocation, nextStopLocation]);

    return null;
};

const DriverRoutePage = () => {
    const [orders, setOrders] = useState([]);
    const [ordersWithCoords, setOrdersWithCoords] = useState([]);
    const [driverLocation, setDriverLocation] = useState(null);
    const [activeOrderId, setActiveOrderId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // 1. Fetch Orders
    useEffect(() => {
        const fetchMyOrders = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/orders', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }); 
                const pendingOrders = data.filter(o => o.status !== 'delivered' && o.status !== 'Completed' && o.status !== 'Cancelled');
                setOrders(pendingOrders);
            } catch (error) {
                console.error('Error fetching orders', error);
            }
        };
        fetchMyOrders();
    }, []);

    // 2. Track Driver Location
    useEffect(() => {
        let watchId;
        if ("geolocation" in navigator) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    setDriverLocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.error("Error getting location:", error.message);
                    // Default to Manila if denied/error
                    if (!driverLocation) setDriverLocation([14.5995, 120.9842]);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setDriverLocation([14.5995, 120.9842]);
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    // 3. Process Coordinates (Geocoding Fallback)
    useEffect(() => {
        const geocodeAddress = async (address) => {
            try {
                const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
                if (response.data && response.data.length > 0) {
                    return [parseFloat(response.data[0].lat), parseFloat(response.data[0].lon)];
                }
            } catch (error) {
                console.error('Geocoding error', error);
            }
            return null;
        };

        const processOrders = async () => {
            setIsLoading(true);
            const processed = [];
            for (let i = 0; i < orders.length; i++) {
                const order = orders[i];
                let coords = null;

                // Use database coordinates if they exist and are valid
                if (order.coordinates && order.coordinates.lat && order.coordinates.lng) {
                    coords = [order.coordinates.lat, order.coordinates.lng];
                } else {
                    // Fallback: Geocode the address
                    const addressToGeocode = order.deliveryAddress || order.address;
                    coords = await geocodeAddress(addressToGeocode);
                    
                    // Fallback to slight offset from Manila if geocoding fails, so they don't stack perfectly
                    if (!coords) {
                        coords = [14.5995 + (i * 0.002), 120.9842 + (i * 0.002)];
                    }
                    
                    // Sleep briefly to respect Nominatim API rate limits (1 req/sec)
                    await new Promise(r => setTimeout(r, 1000));
                }
                processed.push({ ...order, coords });
            }
            setOrdersWithCoords(processed);
            if (processed.length > 0 && !activeOrderId) {
                setActiveOrderId(processed[0]._id);
            }
            setIsLoading(false);
        };

        if (orders.length > 0) {
            processOrders();
        } else {
            setOrdersWithCoords([]);
            setIsLoading(false);
        }
    }, [orders]);

    const activeOrder = ordersWithCoords.find(o => o._id === activeOrderId);
    const nextStopLocation = activeOrder ? activeOrder.coords : null;

    const handleOptimizeRoute = () => {
        if (!driverLocation || ordersWithCoords.length === 0) return;

        const sortedOrders = [...ordersWithCoords].sort((a, b) => {
            const distA = calculateDistance(driverLocation[0], driverLocation[1], a.coords[0], a.coords[1]);
            const distB = calculateDistance(driverLocation[0], driverLocation[1], b.coords[0], b.coords[1]);
            return distA - distB;
        });

        setOrdersWithCoords(sortedOrders);
        if (sortedOrders.length > 0) {
            setActiveOrderId(sortedOrders[0]._id);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <Sidebar role="driver" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <Header breadcrumbs={['Active Route']} />

                <main style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'row-reverse', gap: '1.5rem', overflow: 'hidden' }}>
                    
                    {/* Sidebar: Order Sequence List */}
                    <div style={{ 
                        width: '320px', 
                        background: 'var(--surface-bg)', 
                        borderRadius: '1rem', 
                        padding: '1.5rem', 
                        border: '1px solid var(--border-light)', 
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>
                                Sequence ({ordersWithCoords.length})
                            </h3>
                            <button 
                                onClick={handleOptimizeRoute}
                                disabled={isLoading || !driverLocation || ordersWithCoords.length === 0}
                                style={{
                                    background: '#10B981',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    cursor: (isLoading || !driverLocation || ordersWithCoords.length === 0) ? 'not-allowed' : 'pointer',
                                    opacity: (isLoading || !driverLocation || ordersWithCoords.length === 0) ? 0.5 : 1,
                                    transition: 'background 0.2s ease'
                                }}
                                onMouseOver={(e) => !e.target.disabled && (e.target.style.background = '#059669')}
                                onMouseOut={(e) => !e.target.disabled && (e.target.style.background = '#10B981')}
                            >
                                Optimize
                            </button>
                        </div>
                        
                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                            {isLoading ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Locating addresses...</div>
                            ) : ordersWithCoords.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active deliveries.</div>
                            ) : (
                                ordersWithCoords.map((order, index) => {
                                    const isActive = activeOrderId === order._id;
                                    return (
                                        <div 
                                            key={order._id}
                                            onClick={() => setActiveOrderId(order._id)}
                                            style={{ 
                                                padding: '1rem', 
                                                borderRadius: '0.75rem', 
                                                marginBottom: '0.75rem',
                                                cursor: 'pointer',
                                                border: isActive ? '2px solid #4F46E5' : '1px solid var(--border-light)',
                                                background: isActive ? 'rgba(79, 70, 229, 0.05)' : 'var(--page-bg)',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                                                    {index + 1}. {order.customerName || order.customer?.name}
                                                </div>
                                                {isActive && (
                                                    <span style={{ fontSize: '0.7rem', background: '#4F46E5', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontWeight: 'bold' }}>
                                                        NEXT
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                                {order.address || order.deliveryAddress}
                                            </div>
                                            {driverLocation && order.coords && (
                                                <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.5rem', fontWeight: 'bold' }}>
                                                    🚗 {calculateDistance(driverLocation[0], driverLocation[1], order.coords[0], order.coords[1]).toFixed(1)} km away
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Map Area */}
                    <div style={{ 
                        flex: 1, 
                        borderRadius: '1rem', 
                        overflow: 'hidden', 
                        border: '1px solid var(--border-light)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        position: 'relative'
                    }}>
                        <MapContainer 
                            center={driverLocation || [14.5995, 120.9842]} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            
                            {/* Driver Live Location Marker */}
                            {driverLocation && (
                                <Marker position={driverLocation} icon={DriverIcon}>
                                    <Popup>Your Current Location</Popup>
                                </Marker>
                            )}

                            {/* Destination Markers */}
                            {!isLoading && ordersWithCoords.map((order) => (
                                <Marker 
                                    key={order._id} 
                                    position={order.coords} 
                                    icon={order._id === activeOrderId ? ActiveIcon : DefaultIcon}
                                >
                                    <Popup>
                                        <div style={{ fontWeight: '700' }}>{order.customerName || order.customer?.name}</div>
                                        <div style={{ fontSize: '0.8rem' }}>{order.address || order.deliveryAddress}</div>
                                        <button 
                                            onClick={() => setActiveOrderId(order._id)}
                                            style={{ marginTop: '0.5rem', width: '100%', padding: '0.4rem', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            Set as Next Stop
                                        </button>
                                    </Popup>
                                </Marker>
                            ))}

                            {/* Routing Path */}
                            {!isLoading && driverLocation && nextStopLocation && (
                                <RoutingMachine driverLocation={driverLocation} nextStopLocation={nextStopLocation} />
                            )}
                        </MapContainer>

                        {/* Floating Info Card */}
                        {activeOrder && (
                            <div style={{ 
                                position: 'absolute', 
                                bottom: '2rem', 
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '90%',
                                maxWidth: '600px',
                                background: 'var(--surface-bg)', 
                                padding: '1.25rem 1.5rem', 
                                borderRadius: '1rem', 
                                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                zIndex: 1000,
                                border: '1px solid var(--border-light)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Heading To</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                                        {activeOrder.customerName || activeOrder.customer?.name}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {activeOrder.address || activeOrder.deliveryAddress}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeOrder.address || activeOrder.deliveryAddress)}`)}
                                    style={{ 
                                        background: '#4F46E5', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', 
                                        border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        transition: 'background 0.2s ease'
                                    }}
                                    onMouseOver={(e) => e.target.style.background = '#4338ca'}
                                    onMouseOut={(e) => e.target.style.background = '#4F46E5'}
                                >
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Navigate
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DriverRoutePage;
