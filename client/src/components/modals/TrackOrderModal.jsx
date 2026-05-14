import React, { useState, useEffect } from 'react';
import { X, MapPin, Package, Truck, CheckCircle, Clock, XCircle, User, DollarSign, Map, ExternalLink, AlertTriangle } from 'lucide-react';
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
            map.fitBounds(points, { padding: [50, 50], maxZoom: 16 });
        } else if (points.length === 1) {
            map.setView(points[0], 15);
        }
    }, [points, map]);
    return null;
};

const STATUS_STEPS = [
    { key: 'Pending',     label: 'Order Placed',    icon: Clock },
    { key: 'Dispatched',  label: 'Dispatched',      icon: Package },
    { key: 'Delivering',  label: 'Delivering',       icon: Truck },
    { key: 'delivered',   label: 'Delivered',        icon: CheckCircle },
];

const TrackOrderModal = ({ isOpen, onClose, order }) => {
    const [showMap, setShowMap] = useState(false);
    const [route, setRoute] = useState(null);

    if (!isOpen || !order) return null;

    const isCancelled = order.status === 'Cancelled' || order.status === 'cancelled';
    const isCompleted = order.status === 'delivered' || order.status === 'Completed';

    const currentStepIndex = isCancelled
        ? -1
        : STATUS_STEPS.findIndex(s =>
            s.key.toLowerCase() === order.status.toLowerCase() ||
            (order.status === 'Completed' && s.key === 'delivered')
          );

    const renderItems = () => {
        if (!order.items) return 'No items';
        if (typeof order.items === 'string') return order.items;
        if (Array.isArray(order.items)) {
            return order.items.map((i, idx) => (
                <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.4rem 0.75rem', background: 'var(--page-bg)',
                    border: '1px solid var(--border-light)', borderRadius: '0.5rem'
                }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                        {i.qty}x {i.product?.name || i.productName || 'Item'}
                    </span>
                    <span style={{
                        fontSize: '0.7rem', fontWeight: '700',
                        padding: '0.15rem 0.5rem', borderRadius: '1rem',
                        background: i.payDeposit ? 'var(--badge-blue-bg)' : 'var(--surface-hover)',
                        color: i.payDeposit ? '#1D4ED8' : '#6B7280'
                    }}>
                        {i.payDeposit ? '💧 Deposit' : 'No Deposit'}
                    </span>
                </div>
            ));
        }
        return null;
    };

    const customerPos = order.coordinates?.lat && order.coordinates?.lng
        ? [order.coordinates.lat, order.coordinates.lng] : null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content" style={{
                background: 'var(--input-bg)', borderRadius: '1.5rem', width: '700px', maxWidth: '95vw',
                position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                maxHeight: '92vh', overflowY: 'auto'
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                            {showMap ? 'Delivery Route' : 'Track Order'}
                        </h3>
                        <p style={{ color: '#4F46E5', fontWeight: '700', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                            #{order._id.slice(-6).toUpperCase()}
                        </p>
                    </div>
                    <button onClick={() => showMap ? setShowMap(false) : onClose()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                        <X size={24} />
                    </button>
                </div>

                {showMap ? (
                    /* ─── Map View ─── */
                    <RouteMapInline order={order} customerPos={customerPos} onBack={() => setShowMap(false)} />
                ) : (
                    /* ─── Details View ─── */
                    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Status Progress Tracker */}
                        {isCancelled ? (
                            <div style={{ background: 'var(--badge-red-bg)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #FECACA' }}>
                                <XCircle size={24} color="#EF4444" />
                                <div>
                                    <p style={{ fontWeight: '800', color: '#DC2626', margin: 0 }}>Order Cancelled</p>
                                    <p style={{ fontSize: '0.8rem', color: '#EF4444', margin: '0.25rem 0 0' }}>Reason: <strong>{order.cancelReason || 'Not specified'}</strong></p>
                                    {order.cancelMessage && <p style={{ fontSize: '0.8rem', color: '#EF4444', margin: '0.125rem 0 0' }}>{order.cancelMessage}</p>}
                                </div>
                            </div>
                        ) : order.status === 'Failed Attempt' ? (
                            <div style={{ background: 'var(--badge-red-bg)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #FECACA' }}>
                                <AlertTriangle size={24} color="#EF4444" />
                                <div>
                                    <p style={{ fontWeight: '800', color: '#DC2626', margin: 0 }}>Delivery Failed</p>
                                    <p style={{ fontSize: '0.8rem', color: '#EF4444', margin: '0.25rem 0 0' }}>We attempted to deliver your order but encountered an issue: <strong>{order.failedReason}</strong></p>
                                    {order.failedNote && <p style={{ fontSize: '0.8rem', color: '#EF4444', margin: '0.125rem 0 0' }}>{order.failedNote}</p>}
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: 'var(--page-bg)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--surface-hover)' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Delivery Status</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                                    {/* Connector line */}
                                    <div style={{
                                        position: 'absolute', top: '20px', left: '20px', right: '20px',
                                        height: '2px', background: 'var(--border-light)', zIndex: 0
                                    }} />
                                    <div style={{
                                        position: 'absolute', top: '20px', left: '20px',
                                        height: '2px', zIndex: 1,
                                        width: `calc((100% - 40px) * ${Math.max(0, currentStepIndex) / (STATUS_STEPS.length - 1)})`,
                                        background: '#4F46E5',
                                        transition: 'width 0.5s ease'
                                    }} />

                                    {STATUS_STEPS.map((step, idx) => {
                                        const isCompleted = idx <= currentStepIndex;
                                        const isCurrent = idx === currentStepIndex;
                                        const Icon = step.icon;
                                        return (
                                            <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 2, flex: 1 }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    display: 'grid', placeItems: 'center',
                                                    background: isCompleted ? '#4F46E5' : 'var(--surface-bg)',
                                                    border: `2px solid ${isCompleted ? '#4F46E5' : 'var(--border-light)'}`,
                                                    boxShadow: isCurrent ? '0 0 0 4px rgba(79,70,229,0.15)' : 'none',
                                                    transition: 'all 0.3s'
                                                }}>
                                                    <Icon size={18} color={isCompleted ? 'white' : '#9CA3AF'} />
                                                </div>
                                                <span style={{
                                                    fontSize: '0.75rem', fontWeight: isCurrent ? '800' : '600',
                                                    color: isCompleted ? '#4F46E5' : '#9CA3AF',
                                                    textAlign: 'center'
                                                }}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Delivery Address */}
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <div style={{ padding: '0.5rem', background: 'var(--badge-red-bg)', borderRadius: '0.5rem', flexShrink: 0 }}>
                                <MapPin size={18} color="#EF4444" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>Delivery Address</p>
                                <p style={{ color: 'var(--text-muted)', fontWeight: '500', margin: '0.25rem 0 0', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                    {order.address || order.deliveryAddress || 'Not specified'}
                                </p>
                                {/* View Route button */}
                                {customerPos && (
                                    <button
                                        onClick={() => setShowMap(true)}
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

                        {/* Items with deposit */}
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <div style={{ padding: '0.5rem', background: 'var(--badge-blue-bg)', borderRadius: '0.5rem', flexShrink: 0 }}>
                                <Package size={18} color="#4F46E5" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>Items Ordered</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    {renderItems()}
                                </div>
                            </div>
                        </div>

                        {/* Driver */}
                        {order.assignedDriver && (
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div style={{ padding: '0.5rem', background: 'var(--badge-green-bg)', borderRadius: '0.5rem', flexShrink: 0 }}>
                                    <Truck size={18} color="#10B981" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>Your Driver</p>
                                    <p style={{ color: 'var(--text-main)', fontWeight: '700', margin: '0.125rem 0 0' }}>
                                        {order.assignedDriver?.name || 'Assigned'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Total */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: 'var(--page-bg)', borderRadius: '0.75rem', border: '1px solid var(--surface-hover)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                <DollarSign size={16} color="#10B981" />
                                Total Amount
                            </div>
                            <span style={{ fontWeight: '900', fontSize: '1.25rem', color: 'var(--text-main)' }}>
                                ₱{(order.totalAmount || 0).toLocaleString()}
                            </span>
                        </div>

                        <button
                            onClick={onClose}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '1rem',
                                background: '#4F46E5', color: 'white', fontWeight: '700',
                                border: 'none', cursor: 'pointer', fontSize: '1rem'
                            }}
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Inline Route Map inside modal ─────────────────────────────────
const RouteMapInline = ({ order, customerPos, onBack }) => {
    const [route, setRoute] = useState(null);
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
                console.error('Route error', err);
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
            {/* Route info bar */}
            {distanceKm && (
                <div style={{
                    padding: '0.75rem 2rem', background: 'var(--page-bg)', borderBottom: '1px solid var(--border-light)',
                    display: 'flex', gap: '0.75rem', alignItems: 'center'
                }}>
                    <span style={{ padding: '0.3rem 0.6rem', background: 'var(--badge-blue-bg)', color: '#4F46E5', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: '700' }}>
                        📏 {distanceKm} km
                    </span>
                    <span style={{ padding: '0.3rem 0.6rem', background: 'var(--badge-green-bg)', color: '#059669', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: '700' }}>
                        ⏱ {durationMin} min
                    </span>
                    <div style={{ flex: 1 }}></div>
                    {googleDest && (
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${googleDest}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.3rem 0.6rem', background: 'var(--badge-blue-bg)', color: '#4F46E5',
                                borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '700',
                                textDecoration: 'none', border: '1px solid #C7D2FE'
                            }}
                        >
                            <ExternalLink size={12} /> Google Maps
                        </a>
                    )}
                </div>
            )}

            {/* Map */}
            <div style={{ flex: 1 }}>
                <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
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
                        <Polyline positions={routeCoords} pathOptions={{ color: '#4F46E5', weight: 5, dashArray: '10, 10', lineCap: 'round', opacity: 0.85 }} />
                    )}
                </MapContainer>
            </div>

            {/* Bottom legend */}
            <div style={{
                padding: '0.75rem 2rem', borderTop: '1px solid var(--border-light)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--page-bg)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', background: '#10B981', borderRadius: '50%' }}></div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Origin</span>
                    <div style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', marginLeft: '1rem' }}></div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Customer</span>
                </div>
                <button
                    onClick={onBack}
                    style={{
                        padding: '0.4rem 1rem', background: '#4F46E5', color: 'white',
                        border: 'none', borderRadius: '0.5rem', fontWeight: '700',
                        fontSize: '0.8rem', cursor: 'pointer'
                    }}
                >
                    ← Back to Details
                </button>
            </div>
        </div>
    );
};

export default TrackOrderModal;
