import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { 
    TrendingUp, TrendingDown, Package, Droplets, CreditCard, 
    Calendar, CheckCircle, XCircle, Clock, Truck, Activity, DollarSign
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { getComprehensiveReport } from '../../services';

const ReportsPage = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month'); // today, week, month, custom
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await getComprehensiveReport(period, dateRange.from, dateRange.to);
            setReport(res.data);
        } catch (error) {
            console.error('Error fetching comprehensive report', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (period !== 'custom') {
            fetchReport();
        } else if (dateRange.from && dateRange.to) {
            fetchReport();
        }
    }, [period, dateRange.from, dateRange.to]);

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        if (newPeriod !== 'custom') {
            setDateRange({ from: '', to: '' });
        }
    };

    const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#6B7280'];
    const PIE_COLORS = {
        'Completed': '#10B981',
        'delivered': '#10B981',
        'Delivering': '#3B82F6',
        'Pending': '#F59E0B',
        'Cancelled': '#EF4444',
        'Failed Attempt': '#6B7280',
        'Dispatched': '#8B5CF6'
    };

    if (loading && !report) {
        return (
            <div className="dashboard-container" style={{ background: 'var(--page-bg)' }}>
                <Sidebar role="admin" />
                <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', minHeight: '100vh' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #EEF2FF', borderTopColor: '#4F46E5', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                        <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>Generating Comprehensive Report...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <Sidebar role="admin" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100vh' }}>
                <Header breadcrumbs={['Reports']} />
                <main className="content" style={{ padding: '2rem 3rem', animation: 'fadeIn 0.5s ease-out' }}>
                    
                    {/* 1. Header + Date Filter Bar */}
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>Business Reports</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>Comprehensive analytics and performance metrics.</p>
                        </div>
                        
                        <div style={{ background: 'var(--surface-bg)', padding: '0.5rem', borderRadius: '1rem', border: '1px solid var(--border-light)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {['today', 'week', 'month', 'custom'].map(p => (
                                    <button 
                                        key={p} 
                                        onClick={() => handlePeriodChange(p)}
                                        style={{ 
                                            padding: '0.5rem 1rem', 
                                            borderRadius: '0.75rem', 
                                            border: 'none', 
                                            background: period === p ? 'var(--accent-indigo)' : 'transparent',
                                            color: period === p ? 'white' : 'var(--text-muted)',
                                            fontWeight: '600',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            textTransform: 'capitalize',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            
                            {period === 'custom' && (
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderLeft: '1px solid var(--border-light)', paddingLeft: '0.5rem' }}>
                                    <input 
                                        type="date" 
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)', background: 'var(--page-bg)', color: 'var(--text-main)' }}
                                    />
                                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                                    <input 
                                        type="date" 
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)', background: 'var(--page-bg)', color: 'var(--text-main)' }}
                                    />
                                </div>
                            )}
                        </div>
                    </header>

                    {report && (
                        <>
                            {/* 2. KPI Summary Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                {/* Revenue Card */}
                                <div style={{ padding: '1.5rem', background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'var(--badge-blue-bg)', borderRadius: '1rem' }}><DollarSign size={20} color="#4F46E5" /></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: report.revenue.growthPercent >= 0 ? '#10B981' : '#EF4444', background: report.revenue.growthPercent >= 0 ? 'var(--badge-green-bg)' : 'var(--badge-red-bg)', padding: '0.25rem 0.5rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700' }}>
                                            {report.revenue.growthPercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {Math.abs(report.revenue.growthPercent).toFixed(1)}%
                                        </div>
                                    </div>
                                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>Total Revenue</h4>
                                    <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>₱{report.revenue.total.toLocaleString()}</p>
                                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Delivery: ₱{report.revenue.delivery.toLocaleString()}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                                        <span style={{ color: 'var(--text-muted)' }}>Walk-in: ₱{report.revenue.walkIn.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Expenses Card */}
                                <div style={{ padding: '1.5rem', background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'var(--badge-red-bg)', borderRadius: '1rem' }}><Droplets size={20} color="#EF4444" /></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: report.expenses.growthPercent <= 0 ? '#10B981' : '#EF4444', background: report.expenses.growthPercent <= 0 ? 'var(--badge-green-bg)' : 'var(--badge-red-bg)', padding: '0.25rem 0.5rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700' }}>
                                            {report.expenses.growthPercent <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                            {Math.abs(report.expenses.growthPercent).toFixed(1)}%
                                        </div>
                                    </div>
                                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>Gas Expenses</h4>
                                    <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>₱{report.expenses.gas.toLocaleString()}</p>
                                    <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Based on {report.recentActivity.filter(a => a.type === 'expense').length} recent logs
                                    </div>
                                </div>

                                {/* Net Profit Card */}
                                <div style={{ padding: '1.5rem', background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'var(--badge-green-bg)', borderRadius: '1rem' }}><TrendingUp size={20} color="#10B981" /></div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', background: 'var(--surface-hover)', padding: '0.25rem 0.5rem', borderRadius: '2rem' }}>
                                            {report.revenue.total > 0 ? ((report.revenue.total - report.expenses.gas) / report.revenue.total * 100).toFixed(1) : 0}% Margin
                                        </span>
                                    </div>
                                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>Net Income</h4>
                                    <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>₱{(report.revenue.total - report.expenses.gas).toLocaleString()}</p>
                                    <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Revenue minus operational expenses
                                    </div>
                                </div>

                                {/* Jugs Card */}
                                <div style={{ padding: '1.5rem', background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'var(--badge-yellow-bg)', borderRadius: '1rem' }}><Package size={20} color="#F59E0B" /></div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#F59E0B', background: 'var(--badge-yellow-bg)', padding: '0.25rem 0.5rem', borderRadius: '2rem' }}>
                                            All Time
                                        </span>
                                    </div>
                                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>Customer Jug Balance</h4>
                                    <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)' }}>{report.jugs.outstanding} Units</p>
                                    <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Total jugs currently with customers
                                    </div>
                                </div>
                            </div>

                            {/* 3. Revenue Trend Chart */}
                            <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', padding: '2rem', marginBottom: '2.5rem' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.5rem' }}>Revenue Trend</h3>
                                <div style={{ height: '300px', width: '100%' }}>
                                    {report.revenue.daily.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={report.revenue.daily} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} tickFormatter={(val) => `₱${val}`} />
                                                <RechartsTooltip cursor={{fill: 'var(--surface-hover)'}} contentStyle={{ borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-main)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                                <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                                                <Bar dataKey="delivery" name="Delivery Revenue" stackId="a" fill="#4F46E5" radius={[0, 0, 4, 4]} />
                                                <Bar dataKey="walkIn" name="Walk-in Revenue" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                            No revenue data for this period
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 4. Orders Analytics Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                {/* Status Breakdown */}
                                <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', padding: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.5rem' }}>Order Status Breakdown</h3>
                                    {report.orders.total > 0 ? (
                                        <div style={{ display: 'flex', alignItems: 'center', height: '240px' }}>
                                            <div style={{ flex: 1, height: '100%' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie 
                                                            data={Object.entries(report.orders.byStatus).map(([name, value]) => ({ name, value }))} 
                                                            innerRadius={60} 
                                                            outerRadius={80} 
                                                            paddingAngle={5} 
                                                            dataKey="value"
                                                        >
                                                            {Object.entries(report.orders.byStatus).map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[entry[0]] || COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-main)' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {Object.entries(report.orders.byStatus).map(([status, count], i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: PIE_COLORS[status] || COLORS[i % COLORS.length] }}></div>
                                                            <span style={{ color: 'var(--text-muted)' }}>{status}</span>
                                                        </div>
                                                        <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                            No orders in this period
                                        </div>
                                    )}
                                </div>

                                {/* Order KPIs */}
                                <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Order Metrics</h3>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1 }}>
                                        <div style={{ background: 'var(--page-bg)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--surface-hover)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                                <Package size={16} /> <span style={{ fontSize: '0.85rem' }}>Total Orders</span>
                                            </div>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>{report.orders.total}</span>
                                        </div>
                                        
                                        <div style={{ background: 'var(--page-bg)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--surface-hover)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                                <CheckCircle size={16} color="#10B981" /> <span style={{ fontSize: '0.85rem' }}>Fulfillment Rate</span>
                                            </div>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10B981' }}>{report.orders.fulfillmentRate}%</span>
                                        </div>

                                        <div style={{ background: 'var(--page-bg)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--surface-hover)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                                <XCircle size={16} color="#EF4444" /> <span style={{ fontSize: '0.85rem' }}>Cancelled / Failed</span>
                                            </div>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#EF4444' }}>{report.orders.cancelledCount + report.orders.failedCount}</span>
                                        </div>

                                        <div style={{ background: 'var(--page-bg)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--surface-hover)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                                <Activity size={16} color="#3B82F6" /> <span style={{ fontSize: '0.85rem' }}>Avg Items/Order</span>
                                            </div>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#3B82F6' }}>{report.orders.avgItemsPerOrder}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5. Top Products */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', padding: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.5rem' }}>Top Products by Volume</h3>
                                    <div style={{ height: '200px' }}>
                                        {report.products.topByQuantity.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={report.products.topByQuantity} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 40 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-light)" />
                                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-main)', fontSize: 12, fontWeight: 500}} />
                                                    <RechartsTooltip cursor={{fill: 'var(--surface-hover)'}} contentStyle={{ borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-main)' }} />
                                                    <Bar dataKey="qty" name="Quantity Sold" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No sales data</div>
                                        )}
                                    </div>
                                </div>
                                
                                <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', padding: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.5rem' }}>Top Products by Revenue</h3>
                                    <div style={{ height: '200px' }}>
                                        {report.products.topByRevenue.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={report.products.topByRevenue} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 40 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-light)" />
                                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} tickFormatter={(val) => `₱${val}`} />
                                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-main)', fontSize: 12, fontWeight: 500}} />
                                                    <RechartsTooltip cursor={{fill: 'var(--surface-hover)'}} contentStyle={{ borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-main)' }} formatter={(val) => `₱${val}`} />
                                                    <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No revenue data</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 6. Driver Performance Table */}
                            <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', padding: '2rem', marginBottom: '2.5rem', overflowX: 'auto' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Truck size={20} color="#4F46E5" /> Driver Performance
                                </h3>
                                
                                {report.drivers.performance.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>Driver Name</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>Deliveries Completed</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>Fuel Logged (Liters)</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>Fuel Spend (₱)</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.85rem' }}>Est. Cost/Delivery</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.drivers.performance.map((d, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid var(--surface-hover)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>{d.name}</td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-main)' }}>
                                                        <span style={{ background: 'var(--badge-blue-bg)', color: '#4F46E5', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontWeight: '700', fontSize: '0.85rem' }}>{d.deliveries}</span>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{d.fuelLiters.toFixed(1)} L</td>
                                                    <td style={{ padding: '1rem', color: '#EF4444', fontWeight: '600' }}>₱{d.fuelSpend.toLocaleString()}</td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                                                        {d.deliveries > 0 ? `₱${(d.fuelSpend / d.deliveries).toFixed(2)}` : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No driver activity logged in this period</div>
                                )}
                            </div>

                            {/* 7. Recent Activity Feed */}
                            <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', padding: '2rem' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Activity size={20} color="#10B981" /> Recent Activity
                                </h3>
                                
                                {report.recentActivity.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                        {report.recentActivity.map((activity, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--page-bg)', borderRadius: '1rem', border: '1px solid var(--surface-hover)' }}>
                                                <div style={{ 
                                                    width: '40px', height: '40px', borderRadius: '50%', display: 'grid', placeItems: 'center',
                                                    background: activity.type === 'order' ? 'var(--badge-blue-bg)' : 
                                                               activity.type === 'walkin' ? 'var(--badge-green-bg)' : 'var(--badge-red-bg)'
                                                }}>
                                                    {activity.type === 'order' && <Package size={18} color="#4F46E5" />}
                                                    {activity.type === 'walkin' && <DollarSign size={18} color="#10B981" />}
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

                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ReportsPage;
