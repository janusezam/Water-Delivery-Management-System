import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { 
    CheckCircle, 
    MapPin,
    Package,
    History,
    Hash,
    DollarSign,
    User,
    Calendar,
    Clock,
    Map,
    X,
    ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Customer destination icon (red pin)
const customerIcon = L.divIcon({
    className: 'customer-map-icon',
    html: `<div style="background: #EF4444; color: white; padding: 8px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(239,68,68,0.4); display: flex; align-items: center; justify-content: center;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>`,
    iconSize: [38, 38], iconAnchor: [19, 38]
});

// Store/origin icon (green)
const storeIcon = L.divIcon({
    className: 'store-map-icon',
    html: `<div style="background: #10B981; color: white; padding: 8px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(16,185,129,0.4); display: flex; align-items: center; justify-content: center;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </div>`,
    iconSize: [38, 38], iconAnchor: [19, 38]
});

// Auto-fit map bounds
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

const DeliveryHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapOrder, setMapOrder] = useState(null);
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const driverId = user._id;

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:5000/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const completedStatuses = ['delivered', 'Completed', 'Cancelled', 'cancelled'];
            const delivered = data.filter(o => completedStatuses.includes(o.status));
            
            // Sort by most recent first
            setHistory(delivered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching history', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const OrderCard = ({ order }) => (
        <div style={{
            background: 'var(--surface-bg)', borderRadius: '1.25rem',
            border: '1px solid var(--border-light)', padding: '1.5rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column', gap: '1rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Hash size={14} color="var(--text-light)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4F46E5' }}>
                        {order._id.slice(-6).toUpperCase()}
                    </span>
                </div>
                <span style={{
                    padding: '0.25rem 0.75rem', borderRadius: '2rem',
                    fontSize: '0.75rem', fontWeight: '700',
                    background: ['Cancelled', 'cancelled'].includes(order.status) ? '#FEE2E2' : '#D1FAE5', 
                    color: ['Cancelled', 'cancelled'].includes(order.status) ? '#991B1B' : '#065F46'
                }}>
                    {['Cancelled', 'cancelled'].includes(order.status) ? 'Cancelled' : 'Completed'}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--badge-blue-bg)', borderRadius: '0.5rem', flexShrink: 0 }}>
                    <User size={18} color="#4F46E5" />
                </div>
                <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', margin: 0, fontWeight: '600', textTransform: 'uppercase' }}>Customer</p>
                    <p style={{ fontWeight: '800', color: 'var(--text-main)', margin: 0, fontSize: '1rem' }}>
                        {order.customerName || order.customer?.name || 'Unknown'}
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--badge-red-bg)', borderRadius: '0.5rem', flexShrink: 0 }}>
                    <MapPin size={18} color="#EF4444" />
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', margin: 0, fontWeight: '600', textTransform: 'uppercase' }}>Delivery Address</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, fontWeight: '500', lineHeight: '1.4' }}>
                        {order.address || order.deliveryAddress || 'No address provided'}
                    </p>
                    {/* View Route Button */}
                    {order.coordinates?.lat && order.coordinates?.lng && (
                        <button 
                            onClick={() => setMapOrder(order)}
                            style={{
                                marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
                                padding: '0.35rem 0.75rem', background: 'var(--badge-blue-bg)', color: '#4F46E5',
                                border: '1px solid #C7D2FE', borderRadius: '0.5rem',
                                fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer'
                            }}
                        >
                            <Map size={13} /> View Delivery Route
                        </button>
                    )}
                </div>
            </div>

            {/* Items with deposit info */}
            <div style={{ background: 'var(--page-bg)', borderRadius: '0.75rem', padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Package size={12} /> Delivered Items
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                            <div key={idx} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.5rem 0.75rem', background: 'var(--surface-bg)',
                                border: '1px solid var(--border-light)', borderRadius: '0.5rem'
                            }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                                    {item.qty}x {item.product?.name || item.productName || 'Item'}
                                </span>
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: '700',
                                    padding: '0.15rem 0.5rem', borderRadius: '1rem',
                                    background: item.payDeposit ? 'var(--badge-blue-bg)' : 'var(--surface-hover)',
                                    color: item.payDeposit ? '#1D4ED8' : '#6B7280'
                                }}>
                                    {item.payDeposit ? '💧 Deposit' : 'No Deposit'}
                                </span>
                            </div>
                        ))
                    ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {typeof order.items === 'string' ? order.items : 'No items listed'}
                        </span>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--surface-hover)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={16} color="#10B981" />
                    <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '1rem' }}>
                        ₱{(order.totalAmount || 0).toLocaleString()}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>
                    <Calendar size={14} />
                    {new Date(order.updatedAt).toLocaleDateString()}
                    <Clock size={14} style={{ marginLeft: '0.25rem' }} />
                    {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <Sidebar role="driver" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['Delivery History']} />

                <main style={{ padding: '2rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
                            Delivery History
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
                            Review your past successful deliveries
                        </p>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem' }}>
                            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #EEF2FF', borderTopColor: '#4F46E5', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                            <p style={{ color: 'var(--text-muted)' }}>Loading history...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
                            {history.length > 0 ? (
                                history.map(order => (
                                    <OrderCard key={order._id} order={order} />
                                ))
                            ) : (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px dashed var(--border-light)' }}>
                                    <History size={48} color="var(--text-light)" style={{ marginBottom: '1rem' }} />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No History Yet</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>Your completed deliveries will appear here.</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Route Map Modal */}
            {mapOrder && <DeliveryRouteModal order={mapOrder} onClose={() => setMapOrder(null)} />}
        </div>
    );
};

// ─── Delivery Route Modal ──────────────────────────────────────────
const DeliveryRouteModal = ({ order, onClose }) => {
    const [route, setRoute] = useState(null);
    const customerPos = order.coordinates?.lat && order.coordinates?.lng
        ? [order.coordinates.lat, order.coordinates.lng] : null;

    // For completed orders, we use the store/origin as a reference point
    // We'll estimate a starting point slightly offset if we don't have an exact origin
    // In real usage, you might store the driver's start coordinates when they accept the order
    const storePos = customerPos ? [customerPos[0] + 0.008, customerPos[1] - 0.005] : null;

    useEffect(() => {
        if (!storePos || !customerPos) return;
        let alive = true;
        const fetchRoute = async () => {
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${storePos[1]},${storePos[0]};${customerPos[1]},${customerPos[0]}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const data = await res.json();
                if (alive && data?.routes?.length > 0) {
                    setRoute(data.routes[0]);
                }
            } catch (err) {
                console.error('Route fetch error', err);
            }
        };
        fetchRoute();
        return () => { alive = false; };
    }, [customerPos?.[0], customerPos?.[1]]);

    const mapCenter = customerPos || [8.14, 125.13];
    const boundsPoints = [storePos, customerPos].filter(Boolean);
    const routeCoords = route?.geometry?.coordinates?.map(c => [c[1], c[0]]) || null;
    const distanceKm = route ? (route.distance / 1000).toFixed(1) : null;
    const durationMin = route ? Math.round(route.duration / 60) : null;

    const googleDest = customerPos ? `${customerPos[0]},${customerPos[1]}` : '';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease'
        }} onClick={onClose}>
            <div style={{
                width: '90vw', maxWidth: '800px', height: '75vh',
                background: 'var(--surface-bg)', borderRadius: '1.5rem',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: '800', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                            Delivery Route — #{order._id?.slice(-6).toUpperCase()}
                        </h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {order.customerName || 'Customer'} • {order.address || 'No address'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {distanceKm && (
                            <div style={{
                                display: 'flex', gap: '0.75rem', fontSize: '0.8rem', fontWeight: '700'
                            }}>
                                <span style={{ padding: '0.35rem 0.75rem', background: 'var(--badge-blue-bg)', color: '#4F46E5', borderRadius: '0.5rem' }}>
                                    📏 {distanceKm} km
                                </span>
                                <span style={{ padding: '0.35rem 0.75rem', background: 'var(--badge-green-bg)', color: '#059669', borderRadius: '0.5rem' }}>
                                    ⏱ {durationMin} min
                                </span>
                            </div>
                        )}
                        <button onClick={onClose} style={{
                            background: 'var(--surface-hover)', border: 'none', padding: '0.5rem',
                            borderRadius: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)',
                            display: 'flex', alignItems: 'center'
                        }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Map */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap'
                        />
                        <FitBounds points={boundsPoints} />

                        {storePos && (
                            <Marker position={storePos} icon={storeIcon}>
                                <Popup><strong>Origin</strong></Popup>
                            </Marker>
                        )}

                        {customerPos && (
                            <Marker position={customerPos} icon={customerIcon}>
                                <Popup>
                                    <strong>{order.customerName || 'Customer'}</strong><br />
                                    <span style={{ fontSize: '0.8rem' }}>{order.address}</span>
                                </Popup>
                            </Marker>
                        )}

                        {routeCoords && (
                            <Polyline
                                positions={routeCoords}
                                pathOptions={{
                                    color: '#4F46E5', weight: 5,
                                    dashArray: '10, 10', lineCap: 'round', opacity: 0.85
                                }}
                            />
                        )}
                    </MapContainer>
                </div>

                {/* Bottom bar */}
                <div style={{
                    padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border-light)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--page-bg)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '10px', height: '10px', background: '#10B981', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Origin</span>
                        <div style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', marginLeft: '1rem' }}></div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Customer</span>
                    </div>
                    {googleDest && (
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${googleDest}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                padding: '0.4rem 0.75rem', background: 'var(--badge-blue-bg)',
                                color: '#4F46E5', borderRadius: '0.5rem',
                                fontSize: '0.75rem', fontWeight: '700',
                                textDecoration: 'none', border: '1px solid #C7D2FE'
                            }}
                        >
                            <ExternalLink size={13} /> Open in Google Maps
                        </a>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default DeliveryHistory;
