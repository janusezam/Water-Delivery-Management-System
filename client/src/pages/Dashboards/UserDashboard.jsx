import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { 
    Truck, Package, Check, Clock, Home, ArrowRight, Droplet, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../../services';

const UserDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchData = async () => {
        try {
            const ordersRes = await getOrders();
            const myOrders = ordersRes.data; // Use all data since it's already scoped
            setOrders(myOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user._id]);

    const activeOrders = orders.filter(o => ['Pending', 'pending', 'Dispatched', 'dispatched', 'Delivering', 'delivering'].includes(o.status));
    const recentOrders = orders.slice(0, 5); // Just show the last 5 orders

    const getStatusIndex = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'pending') return 0;
        if (s === 'dispatched') return 1;
        if (s === 'delivering') return 2;
        if (s === 'completed' || s === 'delivered') return 3;
        return 0;
    };

    const getProgressWidth = (status) => {
        const idx = getStatusIndex(status);
        if (idx === 0) return '0%';
        if (idx === 1) return '33%';
        if (idx === 2) return '66%';
        if (idx === 3) return '100%';
        return '0%';
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const getStatusColor = (status) => {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'completed':
            case 'delivered': return '#10B981'; 
            case 'delivering': return '#8B5CF6'; 
            case 'dispatched': return '#F59E0B'; 
            case 'pending': return '#6B7280'; 
            case 'cancelled': return '#EF4444'; 
            default: return 'var(--text-muted)';
        }
    };

    const getStatusText = (status) => {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'delivering': return 'Delivering';
            case 'dispatched': return 'Dispatched';
            case 'pending': return 'Order Placed';
            case 'completed':
            case 'delivered': return 'Delivered';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <style>{`
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: 1.2fr 0.8fr;
                    gap: 2rem;
                }
                @media (max-width: 1024px) {
                    .dashboard-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .status-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    z-index: 3;
                    gap: 0.5rem;
                    background: var(--surface-bg);
                    padding: 0 0.5rem;
                }
            `}</style>

            <Sidebar role="user" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['My Dashboard']} />

                <main style={{ padding: '2rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
                    
                    {/* Simplified Greeting */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
                            {getGreeting()}, {user.name ? user.name.split(' ')[0] : 'User'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    {loading ? (
                        <div style={{ display: 'grid', placeItems: 'center', height: '300px' }}>
                            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid #EEF2FF', borderTopColor: '#4F46E5', borderRadius: '50%' }}></div>
                        </div>
                    ) : (
                        <div className="dashboard-grid">
                            
                            {/* Left Side: Active Delivery Status */}
                            <div>
                                {activeOrders.length === 0 ? (
                                    <div style={{ 
                                        background: 'var(--surface-bg)', 
                                        border: '1px solid var(--border-light)', 
                                        borderRadius: '1.5rem', 
                                        padding: '3rem 2rem', 
                                        textAlign: 'center',
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        justifyContent: 'center'
                                    }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                            <Package size={40} color="#4F46E5" />
                                        </div>
                                        <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Active Deliveries</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', maxWidth: '380px', margin: '0 auto 2rem auto', lineHeight: '1.5' }}>
                                            You don't have any orders currently on the way.
                                        </p>
                                        <button 
                                            onClick={() => navigate('/products')}
                                            style={{ 
                                                background: '#4F46E5', color: 'white', border: 'none', 
                                                padding: '0.85rem 2rem', borderRadius: '1rem', fontWeight: '700', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            <span>Order Now</span>
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {activeOrders.map((order, idx) => {
                                            const statusIdx = getStatusIndex(order.status);
                                            
                                            return (
                                                <div key={order._id || idx} style={{ 
                                                    background: 'var(--surface-bg)', 
                                                    border: '1px solid var(--border-light)', 
                                                    borderRadius: '1.5rem', 
                                                    padding: '2rem'
                                                }}>
                                                    {/* Header */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }}></div>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                            Active Delivery
                                                        </span>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                                                        <div>
                                                            <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
                                                                Order #{order._id ? order._id.slice(-6).toUpperCase() : idx + 1}
                                                            </h3>
                                                            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>
                                                                {order.items.map(item => `${item.qty}x ${item.product?.name || item.productName || 'Water'}`).join(' · ')}
                                                            </p>
                                                        </div>
                                                        <div style={{ 
                                                            background: ['delivering', 'Delivering'].includes(order.status) ? '#EEF2FF' : '#ECFDF5', 
                                                            color: ['delivering', 'Delivering'].includes(order.status) ? '#4F46E5' : '#10B981', 
                                                            padding: '0.5rem 1.25rem', 
                                                            borderRadius: '2rem', 
                                                            fontSize: '0.9rem', 
                                                            fontWeight: '700' 
                                                        }}>
                                                            {getStatusText(order.status)}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Timeline */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', position: 'relative' }}>
                                                        {/* Connectors */}
                                                        <div style={{ position: 'absolute', left: '10%', right: '10%', height: '2px', background: 'var(--border-light)', zIndex: 1, top: '16px' }}></div>
                                                        <div style={{ position: 'absolute', left: '10%', width: getProgressWidth(order.status), height: '2px', background: '#10B981', zIndex: 2, top: '16px', transition: 'width 0.3s' }}></div>
                                                        
                                                        {/* Steps */}
                                                        <div className="status-step">
                                                            <div style={{ 
                                                                width: '34px', height: '34px', borderRadius: '50%', 
                                                                background: '#ECFDF5', color: '#10B981',
                                                                border: '1px solid #10B981',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}>
                                                                <Check size={18} strokeWidth={3} />
                                                            </div>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>Order Placed</span>
                                                        </div>
                                                        
                                                        <div className="status-step">
                                                            <div style={{ 
                                                                width: '34px', height: '34px', borderRadius: '50%', 
                                                                background: statusIdx >= 1 ? '#EEF2FF' : 'var(--surface-hover)', 
                                                                color: statusIdx >= 1 ? '#4F46E5' : 'var(--text-light)',
                                                                border: `1px solid ${statusIdx >= 1 ? '#4F46E5' : 'var(--border-light)'}`,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}>
                                                                <Package size={16} />
                                                            </div>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>Dispatched</span>
                                                        </div>
                                                        
                                                        <div className="status-step">
                                                            <div style={{ 
                                                                width: '34px', height: '34px', borderRadius: '50%', 
                                                                background: statusIdx >= 2 ? '#EEF2FF' : 'var(--surface-hover)', 
                                                                color: statusIdx >= 2 ? '#8B5CF6' : 'var(--text-light)',
                                                                border: `1px solid ${statusIdx >= 2 ? '#8B5CF6' : 'var(--border-light)'}`,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}>
                                                                <Truck size={16} />
                                                            </div>
                                                            <span style={{ fontSize: '0.75rem', color: statusIdx >= 2 ? '#8B5CF6' : 'var(--text-main)', fontWeight: statusIdx >= 2 ? '600' : 'normal' }}>Delivering</span>
                                                        </div>
                                                        
                                                        <div className="status-step">
                                                            <div style={{ 
                                                                width: '34px', height: '34px', borderRadius: '50%', 
                                                                background: statusIdx === 3 ? '#F3F4F6' : 'var(--surface-hover)', 
                                                                color: statusIdx === 3 ? '#4B5563' : 'var(--text-light)',
                                                                border: `1px solid ${statusIdx === 3 ? '#4B5563' : 'var(--border-light)'}`,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}>
                                                                <Home size={16} />
                                                            </div>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>Delivered</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Driver Info */}
                                                    {['delivering', 'Delivering'].includes(order.status) ? (
                                                        <div style={{ background: 'var(--surface-hover)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#DBEAFE', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
                                                                    {order.driver?.name ? order.driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DR'}
                                                                </div>
                                                                <div>
                                                                    <h4 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1.05rem' }}>{order.driver?.name || 'Driver Assigned'}</h4>
                                                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                                                                        Your driver · Plate: {order.driver?.plateNumber || 'N/A'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div style={{ background: '#FEF3C7', color: '#D97706', padding: '0.6rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <Clock size={16} /> ETA 12 min
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ background: 'var(--surface-hover)', borderRadius: '1rem', padding: '1.25rem' }}>
                                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                                Deliver to: <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{order.address}</span>
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Recent Orders */}
                            <div>
                                <div style={{ 
                                    background: 'var(--surface-bg)', 
                                    borderRadius: '1.25rem', 
                                    border: '1px solid var(--border-light)', 
                                    padding: '1.5rem', 
                                }}>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={18} color="#4F46E5" /> Recent Orders
                                    </h3>
                                    {recentOrders.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                            <Package size={36} color="var(--text-light)" style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent orders.</p>
                                        </div>
                                    ) : (
                                        <div style={{ position: 'relative', paddingLeft: '0.5rem' }}>
                                            {/* Vertical Line */}
                                            <div style={{ 
                                                position: 'absolute', 
                                                left: '11px', 
                                                top: '52px', 
                                                bottom: '24px', 
                                                width: '2px', 
                                                background: 'var(--border-light)',
                                                zIndex: 1
                                            }}></div>

                                            {recentOrders.map((order, idx) => (
                                                <div key={order._id} style={{ 
                                                    position: 'relative', 
                                                    paddingLeft: '2rem', 
                                                    marginBottom: idx === recentOrders.length - 1 ? '1.5rem' : '1.5rem',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => navigate('/orders')}
                                                >
                                                    {/* Timeline Dot */}
                                                    <div style={{ 
                                                        position: 'absolute', 
                                                        left: '5px', 
                                                        top: '6px', 
                                                        width: '14px', 
                                                        height: '14px', 
                                                        borderRadius: '50%', 
                                                        background: 'var(--surface-bg)', 
                                                        border: `3px solid ${getStatusColor(order.status)}`,
                                                        zIndex: 2,
                                                        transition: 'transform 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                    ></div>

                                                    {/* Order Content */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                                                {new Date(order.createdAt).toLocaleDateString()} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                                                Order #{order._id ? order._id.slice(-6).toUpperCase() : 'UNKNOWN'}
                                                            </h4>
                                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                                                {order.items.reduce((acc, item) => acc + item.qty, 0)} items · <span style={{ color: getStatusColor(order.status), fontWeight: '600', textTransform: 'capitalize' }}>{order.status}</span>
                                                            </p>
                                                        </div>
                                                        <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                                            ₱{order.totalAmount?.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            <div 
                                                onClick={() => navigate('/orders')}
                                                style={{ 
                                                    paddingLeft: '2rem', 
                                                    fontSize: '0.85rem', 
                                                    color: '#4F46E5', 
                                                    cursor: 'pointer', 
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    transition: 'gap 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.gap = '0.5rem'}
                                                onMouseOut={(e) => e.currentTarget.style.gap = '0.25rem'}
                                            >
                                                View all orders <ArrowRight size={14} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default UserDashboard;
