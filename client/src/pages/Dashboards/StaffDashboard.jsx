import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { 
    ShoppingBag, 
    Plus, 
    Truck, 
    Clock,
    CheckCircle,
    Users
} from 'lucide-react';
import { getWalkIns, getOrders } from '../../services';
import { useNavigate } from 'react-router-dom';

const StaffDashboard = () => {
    const navigate = useNavigate();
    const [walkIns, setWalkIns] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [walkRes, orderRes] = await Promise.all([
                    getWalkIns(),
                    getOrders()
                ]);
                setWalkIns(walkRes.data || []);
                setOrders(orderRes.data || []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const todayTotal = walkIns
        .filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum, s) => sum + s.totalAmount, 0);

    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'on-the-way').length;
    const completedToday = orders.filter(o => 
        o.status === 'delivered' && 
        new Date(o.updatedAt).toDateString() === new Date().toDateString()
    ).length;

    const recentDeliveries = [...orders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
                <Sidebar role="staff" />
                <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
                    <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #EEF2FF', borderTopColor: '#4F46E5', borderRadius: '50%' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <Sidebar role="staff" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumb="Staff / Dashboard" />

                <main style={{ padding: '2rem' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>Operations</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>Monitor your daily sales and dispatch status.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={() => navigate('/customers')}
                                style={{ background: 'var(--surface-bg)', color: '#4F46E5', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>
                                <Plus size={20} />
                                Register Customer
                            </button>
                            <button 
                                onClick={() => navigate('/walk-in')}
                                style={{ background: '#4F46E5', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                                <ShoppingBag size={20} />
                                Open POS
                            </button>
                        </div>
                    </header>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        {[
                            { label: 'Walk-In Sales Today', value: `₱${todayTotal.toLocaleString()}`, icon: <ShoppingBag size={20} color="#4F46E5" />, bg: '#EEF2FF' },
                            { label: 'Active Dispatches', value: pendingOrders, icon: <Clock size={20} color="#F59E0B" />, bg: '#FFFBEB' },
                            { label: 'Delivered Today', value: completedToday, icon: <CheckCircle size={20} color="#10B981" />, bg: '#ECFDF5' }
                        ].map((stat, i) => (
                            <div key={i} style={{ padding: '1.5rem', background: 'var(--surface-bg)', borderRadius: '1rem', border: '1px solid var(--border-light)' }}>
                                <div style={{ padding: '0.75rem', background: stat.bg, borderRadius: '0.75rem', width: 'fit-content', marginBottom: '1rem' }}>{stat.icon}</div>
                                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>{stat.label}</h4>
                                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: 'var(--surface-bg)', borderRadius: '1rem', border: '1px solid var(--border-light)', padding: '2rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Recent Orders</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {recentDeliveries.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No recent orders found.</p>
                            ) : (
                                recentDeliveries.map((order, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--surface-hover)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ padding: '0.5rem', background: 'var(--surface-hover)', borderRadius: '0.75rem' }}><Truck size={20} color="var(--text-muted)" /></div>
                                            <div>
                                                <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)' }}>{order.customer?.name || order.customerName || 'Guest'}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{order.deliveryAddress || 'No address'} • {new Date(order.createdAt).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <span style={{ 
                                            fontSize: '0.75rem', 
                                            fontWeight: '700', 
                                            color: order.status === 'delivered' ? '#10B981' : (order.status === 'on-the-way' ? '#4F46E5' : '#F59E0B'),
                                            background: order.status === 'delivered' ? '#ECFDF5' : (order.status === 'on-the-way' ? '#EEF2FF' : '#FFFBEB'),
                                            padding: '0.375rem 0.75rem', 
                                            borderRadius: '1rem',
                                            textTransform: 'capitalize'
                                        }}>
                                            {order.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StaffDashboard;
