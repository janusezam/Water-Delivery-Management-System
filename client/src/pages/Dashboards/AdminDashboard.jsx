import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { 
    TrendingUp, 
    Users, 
    Truck, 
    AlertTriangle,
    Plus,
    PhilippinePeso,
    ShoppingCart,
    MapPin,
    Package,
    Activity,
    Clock,
    Droplets
} from 'lucide-react';
import { getReportSummary, getOrders, getComprehensiveReport } from '../../services';
import { getTrips } from '../../services/tripSaleService';
import Toast from '../../components/common/Toast';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [activeTrips, setActiveTrips] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [summaryRes, ordersRes, tripsRes, comprehensiveRes] = await Promise.all([
                    getReportSummary(),
                    getOrders(),
                    getTrips(),
                    getComprehensiveReport('month')
                ]);
                setStats(summaryRes.data);
                const pending = ordersRes.data.filter(o => o.status === 'Pending');
                setPendingOrders(pending);
                const active = tripsRes.data.filter(t => t.status === 'active' || t.status === 'pending_review');
                setActiveTrips(active);
                setRecentActivity(comprehensiveRes.data.recentActivity || []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <Sidebar role="admin" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['Dashboard']} />

                {loading ? (
                    <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #EEF2FF', borderTopColor: '#4F46E5', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                            <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>Syncing data...</p>
                        </div>
                    </div>
                ) : (
                    <main style={{ padding: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
                        {/* Summary Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>Overview</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>Welcome back, here is what's happening today.</p>
                            </div>
                            <button style={{ 
                                background: '#4F46E5', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', 
                                border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', 
                                cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                            }}>
                                <Plus size={20} />
                                New Order
                            </button>
                        </div>

                        {/* Stat Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            {[
                                { label: 'Total Revenue', value: `₱${(stats?.revenue?.total || 0).toLocaleString()}`, icon: <PhilippinePeso size={20} color="#10B981" />, trend: 'MTD', bg: 'var(--badge-green-bg)' },
                                { label: 'Total Orders', value: (stats?.totalOrders || 0).toString(), icon: <ShoppingCart size={20} color="#4F46E5" />, trend: 'MTD', bg: 'var(--badge-blue-bg)' },
                                { label: 'Active Drivers', value: (stats?.activeDrivers || 0).toString(), icon: <Users size={20} color="#F59E0B" />, trend: 'Available', bg: 'var(--badge-yellow-bg)' },
                                { label: 'Outstanding Jugs', value: (stats?.jugs?.outstanding || 0).toString(), icon: <AlertTriangle size={20} color="#EF4444" />, trend: 'At Customers', bg: 'var(--badge-red-bg)' }
                            ].map((stat, i) => (
                                <div key={i} style={{ padding: '1.5rem', background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <div style={{ padding: '0.75rem', background: stat.bg, borderRadius: '0.85rem' }}>{stat.icon}</div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: stat.icon.props.color, padding: '0.25rem 0.5rem', background: stat.bg, borderRadius: '2rem' }}>{stat.trend}</span>
                                    </div>
                                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>{stat.label}</h4>
                                    <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                            {/* Pending Orders Queue */}
                            <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-main)' }}>Pending Orders Queue</h3>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#F59E0B', background: 'var(--badge-yellow-bg)', padding: '0.35rem 0.75rem', borderRadius: '2rem' }}>Needs Dispatch</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                                    {pendingOrders.length > 0 ? pendingOrders.map((order, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--page-bg)', borderRadius: '1rem', border: '1px solid var(--surface-hover)' }}>
                                            <div style={{ width: '40px', height: '40px', background: 'var(--surface-bg)', borderRadius: '0.75rem', display: 'grid', placeItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                <ShoppingCart size={20} color="#4F46E5" />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>{order.customerName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.address}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: '700', color: '#4F46E5', fontSize: '0.9rem' }}>₱{order.totalAmount?.toLocaleString()}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.items?.length || 0} items</div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--page-bg)', borderRadius: '1rem', border: '1px dashed var(--border-light)' }}>
                                            <Package size={40} color="var(--text-light)" style={{ marginBottom: '1rem' }} />
                                            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>All orders have been dispatched!</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Active Roaming Trips */}
                            <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-main)' }}>Active Roaming Trips</h3>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10B981', background: 'var(--badge-green-bg)', padding: '0.35rem 0.75rem', borderRadius: '2rem' }}>Live Sales</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                                    {activeTrips.length > 0 ? activeTrips.map((trip, i) => {
                                        const currentRevenue = trip.sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0;
                                        const statusColor = trip.status === 'active' ? '#4F46E5' : '#F59E0B';
                                        const statusBg = trip.status === 'active' ? 'var(--badge-blue-bg)' : 'var(--badge-yellow-bg)';
                                        return (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--page-bg)', borderRadius: '1rem', border: '1px solid var(--surface-hover)' }}>
                                                <div style={{ width: '40px', height: '40px', background: statusBg, borderRadius: '0.75rem', display: 'grid', placeItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                    <Truck size={20} color={statusColor} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>{trip.driver?.name || 'Driver'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{trip.receiptNo}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: '700', color: '#10B981', fontSize: '0.9rem' }}>₱{currentRevenue.toLocaleString()}</div>
                                                    <div style={{ fontSize: '0.75rem', color: statusColor, textTransform: 'capitalize', fontWeight: '600' }}>
                                                        {trip.status.replace('_', ' ')}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--page-bg)', borderRadius: '1rem', border: '1px dashed var(--border-light)' }}>
                                            <Truck size={40} color="var(--text-light)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>No active roaming trips at the moment.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Feed */}
                        <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', padding: '2rem', marginTop: '2.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={20} color="#10B981" /> Recent Activity
                            </h3>
                            
                            {recentActivity.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {recentActivity.map((activity, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--page-bg)', borderRadius: '1rem', border: '1px solid var(--surface-hover)' }}>
                                            <div style={{ 
                                                width: '40px', height: '40px', borderRadius: '50%', display: 'grid', placeItems: 'center',
                                                background: activity.type === 'order' ? 'var(--badge-blue-bg)' : 
                                                           activity.type === 'walkin' ? 'var(--badge-green-bg)' : 'var(--badge-red-bg)'
                                            }}>
                                                {activity.type === 'order' && <Package size={18} color="#4F46E5" />}
                                                {activity.type === 'walkin' && <PhilippinePeso size={18} color="#10B981" />}
                                                {activity.type === 'expense' && <Droplets size={18} color="#EF4444" />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{activity.description}</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                    <Clock size={12} />
                                                    {new Date(activity.time).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent activity found</div>
                            )}
                        </div>
                    </main>
                )}
            </div>

            <Toast 
                {...toast} 
                onClose={() => setToast({ ...toast, show: false })} 
            />
        </div>
    );
};

export default AdminDashboard;
