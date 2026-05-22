import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useSocket from '../../hooks/useSocket';
import axios from 'axios';
import { Truck, Navigation, Package, User, MapPin, Clock, Eye, EyeOff, Search, ChevronRight } from 'lucide-react';

// Custom Driver Icon (Indigo)
const createDriverIcon = (heading, isSelected) => L.divIcon({
    className: 'custom-driver-icon',
    html: `<div style="background: ${isSelected ? '#F43F5E' : '#4F46E5'}; color: white; padding: 8px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px ${isSelected ? 'rgba(244, 63, 94, 0.5)' : 'rgba(79, 70, 229, 0.4)'}; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 17h4V5H2v12h3"/>
                <path d="M20 17h2v-9h-5V5H14v12h3"/>
                <path d="M14 8h5l3 3v5h-3"/>
                <circle cx="6.5" cy="17.5" r="2.5"/>
                <circle cx="17.5" cy="17.5" r="2.5"/>
            </svg>
            ${isSelected ? '<div style="position: absolute; top: -10px; right: -10px; background: #F43F5E; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; animation: pulse 1.5s infinite;"></div>' : ''}
           </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
});

// Custom Order Icon
const createOrderIcon = (status) => {
    const color = status === 'Delivering' ? '#10B981' : '#F59E0B';
    return L.divIcon({
        className: 'custom-order-icon',
        html: `<div style="background: ${color}; color: white; padding: 8px; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
               </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
    });
};

// Spectator Mode Handler
const SpectatorHandler = ({ selectedDriver, drivers, orders, isInitialLoad, setInitialLoad }) => {
    const map = useMap();
    
    useEffect(() => {
        if (selectedDriver) {
            map.setView([selectedDriver.lat, selectedDriver.lng], 16, { animate: true });
        } else if (isInitialLoad) {
            const points = [];
            Object.values(drivers).forEach(d => {
                if (d.hasLocation && d.lat !== null && d.lng !== null) {
                    points.push([d.lat, d.lng]);
                }
            });
            orders.forEach(o => {
                if (o.coordinates?.lat && o.coordinates?.lng) {
                    points.push([o.coordinates.lat, o.coordinates.lng]);
                }
            });

            if (points.length > 0) {
                const bounds = L.latLngBounds(points);
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                setInitialLoad(false);
            }
        }
    }, [selectedDriver, drivers, orders, map, isInitialLoad, setInitialLoad]);

    return null;
};

// Map Resizer to handle sidebar collapse/expand
const MapResizer = () => {
    const map = useMap();
    
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        
        const container = map.getContainer();
        if (container) {
            resizeObserver.observe(container);
        }
        
        return () => {
            resizeObserver.disconnect();
        };
    }, [map]);
    
    return null;
};

// OSRM Routing Component — uses fetch() to avoid axios auth header CORS issues
const RoutedLine = ({ driverPos, orderPos }) => {
    const [route, setRoute] = useState(null);

    // Round to 4 decimals to prevent re-fetching on tiny GPS jitter
    const dLat = Math.round(driverPos[0] * 10000) / 10000;
    const dLng = Math.round(driverPos[1] * 10000) / 10000;
    const oLat = Math.round(orderPos[0] * 10000) / 10000;
    const oLng = Math.round(orderPos[1] * 10000) / 10000;

    useEffect(() => {
        let isMounted = true;
        const fetchRoute = async () => {
            try {
                // OSRM expects: lng,lat;lng,lat
                const url = `https://router.project-osrm.org/route/v1/driving/${dLng},${dLat};${oLng},${oLat}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const data = await res.json();
                if (isMounted && data && data.routes && data.routes.length > 0) {
                    // Map [lng, lat] to [lat, lng] for Leaflet Polyline
                    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    setRoute(coords);
                }
            } catch (err) {
                console.error("Failed to fetch route from OSRM", err);
                // Fallback to straight line if API fails
                if (isMounted) setRoute([driverPos, orderPos]);
            }
        };

        if (driverPos && orderPos) {
            fetchRoute();
        }

        return () => { isMounted = false; };
    }, [dLat, dLng, oLat, oLng]);

    if (!route) return null;

    return (
        <Polyline 
            positions={route}
            pathOptions={{ 
                color: '#4F46E5', 
                weight: 5, 
                dashArray: '10, 10', 
                lineCap: 'round',
                opacity: 0.8
            }}
        />
    );
};

const LiveMapPage = () => {
    const socket = useSocket('http://localhost:5000');
    const [drivers, setDrivers] = useState({});
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDriverId, setSelectedDriverId] = useState(null);
    const [isInitialLoad, setInitialLoad] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [{ data: driversData }, { data: ordersData }] = await Promise.all([
                axios.get('http://localhost:5000/api/drivers', config),
                axios.get('http://localhost:5000/api/orders', config)
            ]);

            const initialDrivers = {};
            driversData.forEach(d => {
                // Use the User ID, not Driver ID, because the socket updates use User ID
                const userId = d.user?._id || d._id;
                
                // Only show drivers that have real GPS data — don't fake a location
                initialDrivers[userId] = {
                    id: userId,
                    name: d.user?.name || 'Unknown Driver',
                    plate: d.plateNo,
                    status: d.status,
                    lat: d.location?.lat || null,
                    lng: d.location?.lng || null,
                    heading: d.location?.heading || 0,
                    lastUpdate: d.location?.updatedAt,
                    hasLocation: !!(d.location?.lat && d.location?.lng)
                };
            });
            setDrivers(initialDrivers);

            const activeOrders = ordersData.filter(o => 
                ['Pending', 'Delivering', 'dispatched', 'Dispatched'].includes(o.status)
            );
            setOrders(activeOrders);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching map data', err);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!socket) return;
        socket.emit('admin:join');
        socket.on('location:update', (data) => {
            setDrivers(prev => {
                const updated = {
                    ...prev,
                    [data.driverId]: {
                        ...prev[data.driverId],
                        lat: data.lat,
                        lng: data.lng,
                        heading: data.heading,
                        lastUpdate: new Date(),
                        hasLocation: true
                    }
                };
                return updated;
            });
        });
        return () => socket.off('location:update');
    }, [socket]);

    const filteredDrivers = Object.values(drivers).filter(d => 
        (d.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (d.plate || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    );

    const selectedDriver = selectedDriverId ? drivers[selectedDriverId] : null;

    // Derive driver's real delivery status from their assigned orders
    const getDriverDeliveryStatus = (driverId) => {
        const driverOrders = orders.filter(o => 
            o.assignedDriver?._id === driverId || o.assignedDriver === driverId
        );
        if (driverOrders.length === 0) {
            return { label: 'AVAILABLE', bg: 'var(--badge-green-bg)', color: '#10B981' };
        }
        const hasInProgress = driverOrders.some(o => o.status === 'Delivering');
        if (hasInProgress) {
            return { label: 'ON DELIVERY', bg: 'var(--badge-blue-bg)', color: '#3b82f6' };
        }
        const hasPending = driverOrders.some(o => o.status === 'Pending' || o.status === 'dispatched' || o.status === 'Dispatched');
        if (hasPending) {
            return { label: 'PENDING DELIVERY', bg: 'var(--badge-yellow-bg)', color: '#f59e0b' };
        }
        return { label: 'AVAILABLE', bg: 'var(--badge-green-bg)', color: '#10B981' };
    };

    return (
        <div className="dashboard-container" style={{ background: 'var(--page-bg)', display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
            <Sidebar role="admin" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <Header breadcrumbs={['Live Fleet Map']} />

                <main className="content" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'row-reverse', gap: '1.5rem', overflow: 'hidden' }}>
                    {/* Right Side: Driver List Sidebar */}
                    <div style={{ 
                        width: '350px', 
                        background: 'var(--surface-bg)', 
                        borderRadius: '1rem', 
                        border: '1px solid var(--border-light)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        display: 'flex', 
                        flexDirection: 'column', 
                        zIndex: 10
                    }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--surface-hover)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Truck size={20} color="#4F46E5" />
                            Fleet Status
                        </h2>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                type="text"
                                placeholder="Search drivers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                                    background: 'var(--page-bg)', border: '1px solid var(--border-light)',
                                    borderRadius: '0.75rem', fontSize: '0.9rem', outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading drivers...</div>
                        ) : filteredDrivers.length > 0 ? (
                            filteredDrivers.map(d => (
                                <div 
                                    key={d.id}
                                    onClick={() => setSelectedDriverId(d.id === selectedDriverId ? null : d.id)}
                                    style={{
                                        padding: '1rem', borderRadius: '0.75rem', marginBottom: '0.75rem',
                                        cursor: 'pointer', transition: 'all 0.2s ease',
                                        background: d.id === selectedDriverId ? 'rgba(79, 70, 229, 0.05)' : 'var(--page-bg)',
                                        border: d.id === selectedDriverId ? '2px solid #4F46E5' : '1px solid var(--border-light)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ 
                                            width: '40px', height: '40px', background: d.id === selectedDriverId ? '#4F46E5' : 'var(--surface-hover)',
                                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: d.id === selectedDriverId ? 'white' : '#6B7280'
                                        }}>
                                            <Navigation size={20} style={{ transform: `rotate(${d.heading}deg)` }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>{d.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Plate: {d.plate}</div>
                                        </div>
                                        {d.id === selectedDriverId ? <Eye size={18} color="#4F46E5" /> : <ChevronRight size={18} color="var(--text-light)" />}
                                    </div>
                                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {(() => {
                                            const status = getDriverDeliveryStatus(d.id);
                                            return (
                                                <span style={{ 
                                                    fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase',
                                                    padding: '0.2rem 0.6rem', borderRadius: '1rem',
                                                    background: status.bg, color: status.color
                                                }}>
                                                    {status.label}
                                                </span>
                                            );
                                        })()}
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                                            {d.lastUpdate ? new Date(d.lastUpdate).toLocaleTimeString() : 'No data'}
                                        </span>
                                    </div>
                                    
                                    {/* Show Assigned Orders */}
                                    {(() => {
                                        const driverOrders = orders.filter(o => o.assignedDriver?._id === d.id || o.assignedDriver === d.id);
                                        if (driverOrders.length > 0) {
                                            return (
                                                <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                                        Assigned Deliveries ({driverOrders.length})
                                                    </div>
                                                    {driverOrders.map(o => (
                                                        <div key={o._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: o.status === 'Delivering' ? '#10B981' : '#F59E0B' }}></div>
                                                            <span style={{ color: 'var(--text-main)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                                                {o.customerName || o.customer?.name || 'Unknown'}
                                                            </span>
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>- {o.status}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No drivers found.</div>
                        )}
                    </div>
                    
                    <div style={{ padding: '1rem', background: 'var(--page-bg)', borderTop: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Total Drivers:</span>
                            <span style={{ fontWeight: '700' }}>{Object.keys(drivers).length}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Active Deliveries:</span>
                            <span style={{ fontWeight: '700' }}>{orders.length}</span>
                        </div>
                    </div>
                </div>

                {/* Left Side: Map Area */}
                <div style={{ 
                    flex: 1, 
                    borderRadius: '1rem', 
                    overflow: 'hidden', 
                    border: '1px solid var(--border-light)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    position: 'relative' 
                }}>
                    {selectedDriverId && (
                        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <div style={{ 
                                background: 'var(--surface-bg)', padding: '0.75rem 1.25rem', borderRadius: '1rem',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid var(--border-light)',
                                display: 'flex', alignItems: 'center', gap: '1rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F43F5E', fontWeight: '800', fontSize: '0.85rem' }}>
                                    <div style={{ width: '8px', height: '8px', background: '#F43F5E', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                                    SPECTATING: {drivers[selectedDriverId].name}
                                </div>
                                <button 
                                    onClick={() => setSelectedDriverId(null)}
                                    style={{ 
                                        background: 'var(--surface-hover)', border: 'none', padding: '0.4rem 0.75rem', 
                                        borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '700', 
                                        cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                    }}
                                >
                                    <EyeOff size={14} /> Stop
                                </button>
                            </div>

                            {/* Warning for missing coordinates */}
                            {orders.filter(o => (o.assignedDriver?._id === selectedDriverId || o.assignedDriver === selectedDriverId) && (!o.coordinates?.lat || !o.coordinates?.lng)).length > 0 && (
                                <div style={{ 
                                    background: 'var(--badge-red-bg)', border: '1px solid #FECACA', color: '#EF4444',
                                    padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '600',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}>
                                    ⚠️ Active order missing customer coordinates - cannot generate route
                                </div>
                            )}
                        </div>
                    )}

                    <MapContainer 
                        center={[14.5995, 120.9842]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap'
                        />
                        
                        <SpectatorHandler 
                            selectedDriver={selectedDriver} 
                            drivers={drivers} 
                            orders={orders}
                            isInitialLoad={isInitialLoad}
                            setInitialLoad={setInitialLoad}
                        />
                        <MapResizer />

                        {/* Driver Markers */}
                        {Object.entries(drivers).map(([id, d]) => (
                            d.hasLocation && d.lat !== null && d.lng !== null && (
                            <Marker 
                                key={`driver-${id}`} 
                                position={[d.lat, d.lng]} 
                                icon={createDriverIcon(d.heading, id === selectedDriverId)}
                            >
                                <Popup>
                                    <div style={{ padding: '0.5rem', minWidth: '200px' }}>
                                        <div style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '0.5rem' }}>{d.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Vehicle: {d.plate || 'N/A'}</div>
                                        {(() => {
                                            const status = getDriverDeliveryStatus(id);
                                            const driverOrders = orders.filter(o => o.assignedDriver?._id === id || o.assignedDriver === id);
                                            return (
                                                <>
                                                    <span style={{ 
                                                        display: 'inline-block', fontSize: '0.7rem', fontWeight: '800',
                                                        padding: '0.2rem 0.6rem', borderRadius: '1rem', marginTop: '0.25rem',
                                                        background: status.bg, color: status.color
                                                    }}>
                                                        {status.label}
                                                    </span>
                                                    {driverOrders.length > 0 && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                                            {driverOrders.length} active order{driverOrders.length > 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                        <button 
                                            onClick={() => setSelectedDriverId(id)}
                                            style={{ 
                                                width: '100%', marginTop: '0.75rem', padding: '0.5rem',
                                                background: '#4F46E5', color: 'white', border: 'none',
                                                borderRadius: '0.5rem', fontWeight: '700', cursor: 'pointer'
                                            }}
                                        >
                                            Track Driver
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                            )
                        ))}

                        {/* Order Markers */}
                        {orders.map((o) => (
                            o.coordinates?.lat && o.coordinates?.lng && (
                                <Marker 
                                    key={`order-${o._id}`} 
                                    position={[o.coordinates.lat, o.coordinates.lng]} 
                                    icon={createOrderIcon(o.status)}
                                >
                                    <Popup>
                                        <div style={{ padding: '0.5rem', minWidth: '200px' }}>
                                            <div style={{ fontWeight: '800', fontSize: '1rem' }}>{o.customerName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>{o.address}</div>
                                            <span style={{ 
                                                fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase',
                                                padding: '0.2rem 0.5rem', borderRadius: '1rem',
                                                background: o.status === 'Delivering' ? 'var(--badge-blue-bg)' : 'var(--badge-yellow-bg)',
                                                color: o.status === 'Delivering' ? '#3b82f6' : '#f59e0b'
                                            }}>
                                                {o.status}
                                            </span>
                                        </div>
                                    </Popup>
                                </Marker>
                            )
                        ))}

                        {/* Driver Routing Line */}
                        {selectedDriver && selectedDriver.lat && selectedDriver.lng && (
                            orders
                                .filter(o => (o.assignedDriver?._id === selectedDriverId || o.assignedDriver === selectedDriverId))
                                .map((o, idx) => {
                                    if (o.coordinates?.lat && o.coordinates?.lng) {
                                        return (
                                            <RoutedLine 
                                                key={`route-${o._id}-${idx}`}
                                                driverPos={[selectedDriver.lat, selectedDriver.lng]}
                                                orderPos={[o.coordinates.lat, o.coordinates.lng]}
                                            />
                                        );
                                    }
                                    return null;
                                })
                        )}
                    </MapContainer>
                </div>
                </main>
            </div>
        </div>
    );
};

export default LiveMapPage;
