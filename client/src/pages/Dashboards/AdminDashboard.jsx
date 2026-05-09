import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { 
    TrendingUp, 
    Users, 
    Truck, 
    AlertTriangle,
    Plus,
    DollarSign,
    ShoppingCart,
    MapPin,
    Package
} from 'lucide-react';
import { getReportSummary, getTrips } from '../../services';
import Toast from '../../components/common/Toast';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [summaryRes, tripsRes] = await Promise.all([
                    getReportSummary(),
                    getTrips()
                ]);
                setStats(summaryRes.data);
                setTrips(tripsRes.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
            <Sidebar role="admin" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['Dashboard']} />

                {loading ? (
                    <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: '#6B7280' }}>
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
                                <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#111827', letterSpacing: '-0.025em' }}>Overview</h2>
                                <p style={{ color: '#6B7280', fontSize: '0.925rem' }}>Welcome back, here is what's happening today.</p>
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
                                { label: 'Total Revenue', value: `₱${(stats?.revenue?.total || 0).toLocaleString()}`, icon: <DollarSign size={20} color="#10B981" />, trend: 'MTD', bg: '#ECFDF5' },
                                { label: 'Total Orders', value: (stats?.totalOrders || 0).toString(), icon: <ShoppingCart size={20} color="#4F46E5" />, trend: 'MTD', bg: '#EEF2FF' },
                                { label: 'Active Drivers', value: (stats?.activeDrivers || 0).toString(), icon: <Users size={20} color="#F59E0B" />, trend: 'Available', bg: '#FFFBEB' },
                                { label: 'Outstanding Jugs', value: (stats?.jugs?.outstanding || 0).toString(), icon: <AlertTriangle size={20} color="#EF4444" />, trend: 'At Customers', bg: '#FEF2F2' }
                            ].map((stat, i) => (
                                <div key={i} style={{ padding: '1.5rem', background: 'white', borderRadius: '1.25rem', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <div style={{ padding: '0.75rem', background: stat.bg, borderRadius: '0.85rem' }}>{stat.icon}</div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: stat.icon.props.color, padding: '0.25rem 0.5rem', background: stat.bg, borderRadius: '2rem' }}>{stat.trend}</span>
                                    </div>
                                    <h4 style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>{stat.label}</h4>
                                    <p style={{ fontSize: '1.75rem', fontWeight: '800', color: '#111827', letterSpacing: '-0.025em' }}>{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                            {/* Ongoing Trips */}
                            <div style={{ background: 'white', borderRadius: '1.25rem', border: '1px solid #E5E7EB', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: '#111827' }}>Active Delivery Trips</h3>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4F46E5', background: '#EEF2FF', padding: '0.35rem 0.75rem', borderRadius: '2rem' }}>Live Tracking</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {trips.length > 0 ? trips.map((trip, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#F9FAFB', borderRadius: '1rem', border: '1px solid #F3F4F6' }}>
                                            <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '0.75rem', display: 'grid', placeItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                <MapPin size={20} color="#4F46E5" />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>{trip.driverName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{trip.destination || 'On Route'} • {trip.status}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: '700', color: '#10B981', fontSize: '0.9rem' }}>Active</div>
                                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Started 10m ago</div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#F9FAFB', borderRadius: '1rem', border: '1px dashed #E5E7EB' }}>
                                            <Package size={40} color="#D1D5DB" style={{ marginBottom: '1rem' }} />
                                            <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>No active trips right now.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Activity Placeholder */}
                            <div style={{ background: 'white', borderRadius: '1.25rem', border: '1px solid #E5E7EB', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: '#111827', marginBottom: '1.5rem' }}>System Status</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {[
                                        { label: 'Database Status', value: 'Connected', color: '#10B981' },
                                        { label: 'Cloudinary Storage', value: 'Active', color: '#10B981' },
                                        { label: 'Map Services', value: 'Operational', color: '#10B981' },
                                        { label: 'Last System Sync', value: 'Just now', color: '#6B7280' }
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#6B7280' }}>{item.label}</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: item.color }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
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
