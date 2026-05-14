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
    Map,
    AlertTriangle
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

const DriverDashboard = () => {
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapOrder, setMapOrder] = useState(null); // order to show in modal map
    const [reportOrder, setReportOrder] = useState(null); // order to report issue for
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
            
            const completedStatuses = ['delivered', 'Completed', 'Cancelled', 'cancelled'];
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

    const [deliveryConfirm, setDeliveryConfirm] = useState(null); // { orderId, jugsReturned }

    const handleUpdateStatus = async (orderId, newStatus) => {
        // For delivery completion, show jug collection modal instead of simple confirm
        if (newStatus === 'delivered') {
            setDeliveryConfirm({ orderId, jugsReturned: 0 });
            return;
        }

        const messages = {
            'Delivering': 'Start this delivery? This will mark it as Delivering.',
        };
        const confirmMsg = messages[newStatus] || 'Update status?';
        if (!window.confirm(confirmMsg)) return;
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

    const handleConfirmDelivery = async () => {
        if (!deliveryConfirm) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${deliveryConfirm.orderId}`,
                { status: 'delivered', jugsReturned: deliveryConfirm.jugsReturned },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDeliveryConfirm(null);
            fetchOrders();
        } catch (error) {
            console.error('Error completing delivery:', error);
            alert('Failed to complete delivery');
        }
    };

    const handleReportIssueSubmit = async (orderId, reason, note) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${orderId}`,
                { status: 'Failed Attempt', failedReason: reason, failedNote: note },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReportOrder(null);
            fetchOrders();
        } catch (error) {
            console.error('Error reporting issue:', error);
            alert('Failed to report issue');
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            'Pending':    { bg: '#FEF9C3', color: '#92400E', label: 'Pending' },
            'Dispatched': { bg: '#EEF2FF', color: '#4F46E5', label: 'Dispatched' },
            'Delivering':{ bg: '#DBEAFE', color: '#1D4ED8', label: 'Delivering' },
            'Failed Attempt': { bg: '#FEE2E2', color: '#991B1B', label: 'Failed Attempt' },
        };
        return map[status] || { bg: 'var(--surface-hover)', color: 'var(--text-muted)', label: status };
    };

    const OrderCard = ({ order }) => {
        const badge = getStatusBadge(order.status);
        
        let distanceText = null;
        if (driverPosition && order.coordinates?.lat && order.coordinates?.lng) {
            const distance = calculateDistance(
                driverPosition.lat, driverPosition.lng, 
                order.coordinates.lat, order.coordinates.lng
            ).toFixed(1);
            distanceText = `🚗 ${distance} km away`;
        }
        return (
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
                        background: badge.bg, color: badge.color
                    }}>
                        {badge.label}
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
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', margin: 0, fontWeight: '600', textTransform: 'uppercase' }}>Delivery Address</p>
                            {distanceText && (
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10B981', background: 'var(--badge-green-bg)', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>
                                    {distanceText}
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, fontWeight: '500', lineHeight: '1.4' }}>
                            {order.address || order.deliveryAddress || 'No address provided'}
                        </p>
                    </div>
                </div>

                <div style={{ background: 'var(--page-bg)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Package size={12} /> Items to Deliver
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {Array.isArray(order.items) && order.items.length > 0 ? (
                            order.items.map((item, idx) => (
                                <span key={idx} style={{
                                    padding: '0.35rem 0.75rem', background: 'var(--surface-bg)',
                                    border: '1px solid var(--border-light)', borderRadius: '0.5rem',
                                    fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)'
                                }}>
                                    {item.qty}x {item.product?.name || item.productName || 'Item'} ({item.payDeposit ? 'Deposit' : 'No Deposit'})
                                </span>
                            ))
                        ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {typeof order.items === 'string' ? order.items : 'No items listed'}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.25rem', borderTop: '1px solid var(--surface-hover)' }}>
                    <DollarSign size={16} color="#10B981" />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Amount:</span>
                    <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '1rem' }}>
                        ₱{(order.totalAmount || 0).toLocaleString()}
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <button
                        style={{
                            width: '100%', padding: '0.75rem', background: 'var(--badge-blue-bg)',
                            color: '#4F46E5', border: '1px solid #C7D2FE', borderRadius: '0.75rem',
                            fontWeight: '700', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                        onClick={() => setMapOrder(order)}
                    >
                        <Map size={18} /> View Route Map
                    </button>

                    {(order.status === 'Pending' || order.status === 'Dispatched') && (
                        <button
                            style={{
                                width: '100%', padding: '0.875rem', background: '#F59E0B',
                                color: 'white', border: 'none', borderRadius: '0.75rem',
                                fontWeight: '700', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}
                            onClick={() => handleUpdateStatus(order._id, 'Delivering')}
                        >
                            <Truck size={18} /> Start Delivery
                        </button>
                    )}
                    {order.status === 'Delivering' && (
                        <>
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
                            <button
                                style={{
                                    width: '100%', padding: '0.75rem', background: 'var(--badge-red-bg)',
                                    color: '#DC2626', border: '1px solid #FECACA', borderRadius: '0.75rem',
                                    fontWeight: '700', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                }}
                                onClick={() => setReportOrder(order)}
                            >
                                <AlertTriangle size={18} /> Report Issue
                            </button>
                        </>
                    )}
                    {order.status === 'Failed Attempt' && (
                        <div style={{ background: 'var(--badge-red-bg)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #FECACA', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626', fontWeight: '700', marginBottom: '0.25rem' }}>
                                <AlertTriangle size={16} /> Failure Reported
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#991B1B' }}><strong>Reason:</strong> {order.failedReason}</p>
                            {order.failedNote && <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#991B1B' }}><strong>Note:</strong> {order.failedNote}</p>}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <Sidebar role="driver" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['My Deliveries']} />

                <main style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
                                My Deliveries
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
                                {activeOrders.length} active deliveries assigned to you
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', background: 'var(--badge-green-bg)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: '700' }}>
                            <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                            GPS TRANSMITTING
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem' }}>
                            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #EEF2FF', borderTopColor: '#4F46E5', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                            <p style={{ color: 'var(--text-muted)' }}>Loading your deliveries...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
                            {activeOrders.length > 0 ? (
                                activeOrders.map(order => (
                                    <OrderCard key={order._id} order={order} />
                                ))
                            ) : (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px dashed var(--border-light)' }}>
                                    <Truck size={48} color="var(--text-light)" style={{ marginBottom: '1rem' }} />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Active Deliveries</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>New assignments will appear here as soon as they are assigned to you.</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Route Map Modal */}
            {mapOrder && <RouteMapModal order={mapOrder} driverPosition={driverPosition} onClose={() => setMapOrder(null)} />}

            {/* Report Issue Modal */}
            {reportOrder && <ReportIssueModal order={reportOrder} onClose={() => setReportOrder(null)} onSubmit={handleReportIssueSubmit} />}

            {/* Delivery Confirmation Modal — Jug Collection */}
            {deliveryConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        width: '90vw', maxWidth: '420px', background: 'var(--surface-bg)', borderRadius: '1.5rem',
                        padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        display: 'flex', flexDirection: 'column', gap: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.25rem', color: 'var(--text-main)' }}>Complete Delivery</h3>
                            <button onClick={() => setDeliveryConfirm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} color="var(--text-light)" />
                            </button>
                        </div>

                        <div style={{ background: '#F0FDF4', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #BBF7D0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: '700', marginBottom: '0.75rem' }}>
                                <CheckCircle size={18} /> Delivery Completed
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803D' }}>
                                Before confirming, please record how many <strong>empty jugs/containers</strong> you collected from the customer.
                            </p>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                Empty Jugs Collected
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={() => setDeliveryConfirm(prev => ({ ...prev, jugsReturned: Math.max(0, prev.jugsReturned - 1) }))}
                                    style={{
                                        width: '44px', height: '44px', borderRadius: '0.75rem', border: '1px solid var(--border-medium)',
                                        background: 'var(--page-bg)', cursor: 'pointer', fontSize: '1.25rem', fontWeight: '700',
                                        color: '#4F46E5', display: 'grid', placeItems: 'center'
                                    }}
                                >−</button>
                                <span style={{
                                    fontSize: '2rem', fontWeight: '900', color: 'var(--text-main)',
                                    minWidth: '60px', textAlign: 'center'
                                }}>
                                    {deliveryConfirm.jugsReturned}
                                </span>
                                <button
                                    onClick={() => setDeliveryConfirm(prev => ({ ...prev, jugsReturned: prev.jugsReturned + 1 }))}
                                    style={{
                                        width: '44px', height: '44px', borderRadius: '0.75rem', border: '1px solid var(--border-medium)',
                                        background: 'var(--page-bg)', cursor: 'pointer', fontSize: '1.25rem', fontWeight: '700',
                                        color: '#4F46E5', display: 'grid', placeItems: 'center'
                                    }}
                                >+</button>
                            </div>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                                Enter 0 if no empty containers were returned by the customer.
                            </p>
                        </div>

                        <button
                            onClick={handleConfirmDelivery}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '0.75rem', border: 'none',
                                background: '#10B981', color: 'white', fontWeight: '700', fontSize: '0.95rem',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            <CheckCircle size={20} /> Confirm Delivery
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Report Issue Modal ─────────────────────────────────────────
const ReportIssueModal = ({ order, onClose, onSubmit }) => {
    const [reason, setReason] = useState('Customer unavailable');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit(order._id, reason, note);
        setLoading(false);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                width: '90vw', maxWidth: '500px', background: 'var(--surface-bg)', borderRadius: '1.5rem',
                padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.25rem', color: 'var(--text-main)' }}>Report Delivery Issue</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-light)" /></button>
                </div>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Reason for Failure</label>
                        <select 
                            value={reason} 
                            onChange={e => setReason(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-medium)', boxSizing: 'border-box' }}
                        >
                            <option value="Customer unavailable">Customer unavailable</option>
                            <option value="Wrong address">Wrong address</option>
                            <option value="Vehicle issue">Vehicle issue</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Additional Notes</label>
                        <textarea 
                            value={note} 
                            onChange={e => setNote(e.target.value)}
                            rows={3}
                            placeholder="Provide any details here..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-medium)', boxSizing: 'border-box' }}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{
                            padding: '1rem', background: '#EF4444', color: 'white', borderRadius: '0.75rem',
                            fontWeight: '700', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '0.5rem'
                        }}
                    >
                        {loading ? 'Submitting...' : 'Submit Issue'}
                    </button>
                </form>
            </div>
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
                background: 'var(--surface-bg)', borderRadius: '1.5rem',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }} onClick={e => e.stopPropagation()}>

                {/* Modal Header */}
                <div style={{
                    padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontWeight: '800', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                            Route to {order.customerName || 'Customer'}
                        </h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {order.address || 'No address'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${googleDest}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.5rem 1rem', background: 'var(--badge-blue-bg)',
                                color: '#4F46E5', borderRadius: '0.75rem',
                                fontSize: '0.8rem', fontWeight: '700',
                                textDecoration: 'none', border: '1px solid #C7D2FE'
                            }}
                        >
                            <ExternalLink size={14} /> Google Maps
                        </a>
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
                    {!customerPos && (
                        <div style={{
                            position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
                            zIndex: 1000, background: 'var(--badge-red-bg)', border: '1px solid #FECACA',
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
                    padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--page-bg)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '10px', height: '10px', background: '#4F46E5', borderRadius: '50%' }}></div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your Location</span>
                        <div style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%', marginLeft: '1rem' }}></div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Customer</span>
                        <div style={{ width: '20px', height: '3px', background: '#4F46E5', borderRadius: '2px', marginLeft: '1rem', borderTop: '2px dashed #4F46E5' }}></div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Route</span>
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
