import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { 
    Truck, 
    CheckCircle, 
    MapPin,
    Package,
    Navigation,
    Hash,
    DollarSign,
    User,
    X,
    ExternalLink,
    Map
} from 'lucide-react';
import useSocket from '../../hooks/useSocket';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Driver marker icon (blue arrow)
const driverIcon = L.divIcon({
    className: 'driver-map-icon',
    html: `<div style="background: #4F46E5; color: white; padding: 8px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(79,70,229,0.4); display: flex; align-items: center; justify-content: center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5-5 18-2-9-9-2Z"/></svg>
    </div>`,
    iconSize: [38, 38], iconAnchor: [19, 19]
});

// Customer destination icon (red pin)
const customerIcon = L.divIcon({
    className: 'customer-map-icon',
    html: `<div style="background: #EF4444; color: white; padding: 8px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(239,68,68,0.4); display: flex; align-items: center; justify-content: center;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>`,
    iconSize: [38, 38], iconAnchor: [19, 38]
});

// Auto-fit map to show both markers
const FitBounds = ({ points }) => {
    const map = useMap();
    useEffect(() => {
        if (points.length >= 2) {
            map.fitBounds(points, { padding: [60, 60], maxZoom: 16 });
        } else if (points.length === 1) {
            map.setView(points[0], 15);
        }
    }, [points, map]);
    return null;
};

const DriverDashboard = () => {
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapOrder, setMapOrder] = useState(null); // order to show in modal map
    const [driverPosition, setDriverPosition] = useState(null);
    const [routeCoords, setRouteCoords] = useState(null);
    const socket = useSocket('http://localhost:5000');
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const driverId = user._id;

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:5000/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const completedStatuses = ['delivered', 'Completed'];
            const active = data.filter(o => !completedStatuses.includes(o.status));
            
            setActiveOrders(active);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // GPS Tracking Logic
    useEffect(() => {
        if (!socket || !navigator.geolocation || !driverId) return;

        socket.emit('driver:join', driverId);

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, heading } = position.coords;
                setDriverPosition({ lat: latitude, lng: longitude });
                socket.emit('driver:location', {
                    driverId,
                    lat: latitude,
                    lng: longitude,
                    heading: heading || 0
                });
            },
            (error) => console.error('GPS Error:', error),
            { enableHighAccuracy: true, distanceFilter: 10 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [socket, driverId]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        const messages = {
            'In Progress': 'Start this delivery? This will mark it as In Progress.',
            'delivered': 'Mark this order as delivered and complete?'
        };
        if (!window.confirm(messages[newStatus] || 'Update status?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${orderId}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchOrders(); 
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Failed to update order status');
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            'Pending':    { bg: '#FEF9C3', color: '#92400E', label: 'Pending' },
            'In Progress':{ bg: '#DBEAFE', color: '#1D4ED8', label: 'In Progress' },
        };
        return map[status] || { bg: '#F3F4F6', color: '#374151', label: status };
    };

    const OrderCard = ({ order }) => {
        const badge = getStatusBadge(order.status);
        return (
            <div style={{
                background: 'white', borderRadius: '1.25rem',
                border: '1px solid #E5E7EB', padding: '1.5rem',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Hash size={14} color="#9CA3AF" />
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4F46E5' }}>
                            {order._id.slice(-6).toUpperCase()}
                        </span>
                    </div>
                    <span style={{
                        padding: '0.25rem 0.75rem', borderRadius: '2rem',
                        fontSize: '0.75rem', fontWeight: '700',
                        background: badge.bg, color: badge.color
                    }}>
                        {badge.label}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', background: '#EEF2FF', borderRadius: '0.5rem', flexShrink: 0 }}>
                        <User size={18} color="#4F46E5" />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.7rem', color: '#9CA3AF', margin: 0, fontWeight: '600', textTransform: 'uppercase' }}>Customer</p>
                        <p style={{ fontWeight: '800', color: '#111827', margin: 0, fontSize: '1rem' }}>
                            {order.customerName || order.customer?.name || 'Unknown'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', background: '#FEF2F2', borderRadius: '0.5rem', flexShrink: 0 }}>
                        <MapPin size={18} color="#EF4444" />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.7rem', color: '#9CA3AF', margin: 0, fontWeight: '600', textTransform: 'uppercase' }}>Delivery Address</p>
                        <p style={{ fontSize: '0.9rem', color: '#374151', margin: 0, fontWeight: '500', lineHeight: '1.4' }}>
                            {order.address || order.deliveryAddress || 'No address provided'}
                        </p>
                    </div>
                </div>

                <div style={{ background: '#F9FAFB', borderRadius: '0.75rem', padding: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Package size={12} /> Items to Deliver
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {Array.isArray(order.items) && order.items.length > 0 ? (
                            order.items.map((item, idx) => (
                                <span key={idx} style={{
                                    padding: '0.35rem 0.75rem', background: 'white',
                                    border: '1px solid #E5E7EB', borderRadius: '0.5rem',
                                    fontSize: '0.85rem', fontWeight: '700', color: '#374151'
                                }}>
                                    {item.qty}x {item.product?.name || item.productName || 'Item'} ({item.payDeposit ? 'Deposit' : 'No Deposit'})
                                </span>
                            ))
                        ) : (
                            <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                {typeof order.items === 'string' ? order.items : 'No items listed'}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.25rem', borderTop: '1px solid #F3F4F6' }}>
                    <DollarSign size={16} color="#10B981" />
                    <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Total Amount:</span>
                    <span style={{ fontWeight: '800', color: '#111827', fontSize: '1rem' }}>
                        ₱{(order.totalAmount || 0).toLocaleString()}
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <button
                        style={{
                            width: '100%', padding: '0.75rem', background: '#EEF2FF',
                            color: '#4F46E5', border: '1px solid #C7D2FE', borderRadius: '0.75rem',
                            fontWeight: '700', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                        onClick={() => setMapOrder(order)}
                    >
                        <Map size={18} /> View Route Map
                    </button>

                    {order.status === 'Pending' && (
                        <button
                            style={{
                                width: '100%', padding: '0.875rem', background: '#F59E0B',
                                color: 'white', border: 'none', borderRadius: '0.75rem',
                                fontWeight: '700', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}
                            onClick={() => handleUpdateStatus(order._id, 'In Progress')}
                        >
                            <Truck size={18} /> Start Delivery
                        </button>
                    )}
                    {order.status === 'In Progress' && (
                        <button
                            style={{
                                width: '100%', padding: '0.875rem', background: '#10B981',
                                color: 'white', border: 'none', borderRadius: '0.75rem',
                                fontWeight: '700', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}
                            onClick={() => handleUpdateStatus(order._id, 'delivered')}
                        >
                            <CheckCircle size={18} /> Mark as Delivered
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
            <Sidebar role="driver" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['My Deliveries']} />

                <main style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#111827', letterSpacing: '-0.025em' }}>
                                My Deliveries
                            </h2>
                            <p style={{ color: '#6B7280', fontSize: '0.925rem' }}>
                                {activeOrders.length} active deliveries assigned to you
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', background: '#ECFDF5', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: '700' }}>
                            <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                            GPS TRANSMITTING
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem' }}>
                            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #EEF2FF', borderTopColor: '#4F46E5', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                            <p style={{ color: '#6B7280' }}>Loading your deliveries...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
                            {activeOrders.length > 0 ? (
                                activeOrders.map(order => (
                                    <OrderCard key={order._id} order={order} />
                                ))
                            ) : (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', background: 'white', borderRadius: '1.25rem', border: '1px dashed #E5E7EB' }}>
                                    <Truck size={48} color="#D1D5DB" style={{ marginBottom: '1rem' }} />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>No Active Deliveries</h3>
                                    <p style={{ color: '#6B7280' }}>New assignments will appear here as soon as they are assigned to you.</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Route Map Modal */}
            {mapOrder && <RouteMapModal order={mapOrder} driverPosition={driverPosition} onClose={() => setMapOrder(null)} />}
        </div>
    );
};

// ─── Route Map Modal ────────────────────────────────────────────
const RouteMapModal = ({ order, driverPosition, onClose }) => {
    const [route, setRoute] = useState(null);
    const customerPos = order.coordinates?.lat && order.coordinates?.lng
        ? [order.coordinates.lat, order.coordinates.lng] : null;
    const driverPos = driverPosition ? [driverPosition.lat, driverPosition.lng] : null;

    // Fetch OSRM route
    useEffect(() => {
        if (!driverPos || !customerPos) return;
        let alive = true;
        const fetchRoute = async () => {
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${driverPos[1]},${driverPos[0]};${customerPos[1]},${customerPos[0]}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const data = await res.json();
                if (alive && data?.routes?.length > 0) {
                    setRoute(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
                }
            } catch (err) {
                console.error('Route fetch error', err);
                if (alive) setRoute([driverPos, customerPos]);
            }
        };
        fetchRoute();
        return () => { alive = false; };
    }, [driverPos?.[0], driverPos?.[1], customerPos?.[0], customerPos?.[1]]);

    const mapCenter = customerPos || driverPos || [8.14, 125.13];
    const boundsPoints = [driverPos, customerPos].filter(Boolean);

    // Distance & duration from OSRM
    const googleDest = customerPos ? `${customerPos[0]},${customerPos[1]}` : encodeURIComponent(order.address || '');

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
        }} onClick={onClose}>
            <div style={{
                width: '90vw', maxWidth: '900px', height: '80vh',
                background: 'white', borderRadius: '1.5rem',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }} onClick={e => e.stopPropagation()}>

                {/* Modal Header */}
                <div style={{
                    padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: '800', color: '#111827', fontSize: '1.1rem' }}>
                            Route to {order.customerName || 'Customer'}
                        </h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
                            {order.address || 'No address'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${googleDest}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.5rem 1rem', background: '#EEF2FF',
                                color: '#4F46E5', borderRadius: '0.75rem',
                                fontSize: '0.8rem', fontWeight: '700',
                                textDecoration: 'none', border: '1px solid #C7D2FE'
                            }}
                        >
                            <ExternalLink size={14} /> Google Maps
                        </a>
                        <button onClick={onClose} style={{
                            background: '#F3F4F6', border: 'none', padding: '0.5rem',
                            borderRadius: '0.5rem', cursor: 'pointer', color: '#6B7280',
                            display: 'flex', alignItems: 'center'
                        }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Map */}
                <div style={{ flex: 1, position: 'relative' }}>
                    {!customerPos && (
                        <div style={{
                            position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
                            zIndex: 1000, background: '#FEF2F2', border: '1px solid #FECACA',
                            color: '#EF4444', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                            fontSize: '0.8rem', fontWeight: '600'
                        }}>
                            ⚠️ Customer coordinates not available for this order
                        </div>
                    )}
                    <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap'
                        />
                        <FitBounds points={boundsPoints} />

                        {/* Driver marker */}
                        {driverPos && (
                            <Marker position={driverPos} icon={driverIcon}>
                                <Popup><strong>You are here</strong></Popup>
                            </Marker>
                        )}

                        {/* Customer marker */}
                        {customerPos && (
                            <Marker position={customerPos} icon={customerIcon}>
                                <Popup>
                                    <strong>{order.customerName || 'Customer'}</strong><br />
                                    <span style={{ fontSize: '0.8rem' }}>{order.address}</span>
                                </Popup>
                            </Marker>
                        )}

                        {/* Route line */}
                        {route && (
                            <Polyline
                                positions={route}
                                pathOptions={{
                                    color: '#4F46E5', weight: 5,
                                    dashArray: '10, 10', lineCap: 'round', opacity: 0.85
                                }}
                            />
                        )}
                    </MapContainer>
                </div>

                {/* Bottom info bar */}
                <div style={{
                    padding: '1rem 1.5rem', borderTop: '1px solid #E5E7EB',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#F9FAFB'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '10px', height: '10px', background: '#4F46E5', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Your Location</span>
                        <div style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', marginLeft: '1rem' }}></div>
                        <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Customer</span>
                        <div style={{ width: '20px', height: '3px', background: '#4F46E5', borderRadius: '2px', marginLeft: '1rem', borderTop: '2px dashed #4F46E5' }}></div>
                        <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Route</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#4F46E5' }}>
                        Order #{order._id?.slice(-6).toUpperCase()}
                    </span>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default DriverDashboard;
