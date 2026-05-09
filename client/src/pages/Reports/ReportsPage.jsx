import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { BarChart3, TrendingUp, TrendingDown, Package, CreditCard, ShoppingBag, Truck } from 'lucide-react';
import { getReportSummary } from '../../services';

const ReportsPage = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const { data } = await getReportSummary();
                setSummary(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching report', error);
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    return (
        <div className="dashboard-container" style={{ background: '#F9FAFB' }}>
            <Sidebar role="admin" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {loading ? (
                    <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: '#6B7280', minHeight: '100vh' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #EEF2FF', borderTopColor: '#4F46E5', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                            <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>Generating Reports...</p>
                        </div>
                    </div>
                ) : (
                    <main className="content" style={{ padding: '2rem 3rem', animation: 'fadeIn 0.5s ease-out' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#111827', letterSpacing: '-0.025em' }}>Business Reports</h2>
                                <p style={{ color: '#6B7280', fontSize: '0.925rem' }}>Insights into revenue, expenses, and jug accountability.</p>
                            </div>
                        </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div style={{ padding: '1.5rem', background: 'white', borderRadius: '1.25rem', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: '#EEF2FF', borderRadius: '1rem' }}><TrendingUp size={20} color="#4F46E5" /></div>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#10B981' }}>+12.5%</span>
                        </div>
                        <h4 style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: '500' }}>Total Revenue (MTD)</h4>
                        <p style={{ fontSize: '1.75rem', fontWeight: '800', color: '#111827' }}>₱{summary.revenue.total.toLocaleString()}</p>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <span style={{ color: '#6B7280' }}>Walk-in: ₱{summary.revenue.walkIn.toLocaleString()}</span>
                            <span style={{ color: '#6B7280' }}>•</span>
                            <span style={{ color: '#6B7280' }}>Delivery: ₱{summary.revenue.delivery.toLocaleString()}</span>
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem', background: 'white', borderRadius: '1.25rem', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: '#FEF2F2', borderRadius: '1rem' }}><TrendingDown size={20} color="#EF4444" /></div>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#EF4444' }}>Fuel Costs</span>
                        </div>
                        <h4 style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: '500' }}>Total Expenses (MTD)</h4>
                        <p style={{ fontSize: '1.75rem', fontWeight: '800', color: '#111827' }}>₱{summary.expenses.gas.toLocaleString()}</p>
                        <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#6B7280' }}>Based on all logged driver fuel receipts.</p>
                    </div>

                    <div style={{ padding: '1.5rem', background: 'white', borderRadius: '1.25rem', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: '#FFFBEB', borderRadius: '1rem' }}><Package size={20} color="#F59E0B" /></div>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#F59E0B' }}>Outstanding</span>
                        </div>
                        <h4 style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: '500' }}>Customer Jug Balance</h4>
                        <p style={{ fontSize: '1.75rem', fontWeight: '800', color: '#111827' }}>{summary.jugs.outstanding} Units</p>
                        <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#6B7280' }}>Total jugs currently with customers.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    <div style={{ background: 'white', borderRadius: '1.25rem', border: '1px solid #E5E7EB', padding: '2rem' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dark)' }}>
                            <BarChart3 size={20} color="var(--accent-indigo)" />
                            Revenue Distribution
                        </h4>
                        <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', gap: '2rem' }}>
                            {[
                                { label: 'Week 1', val: 65 },
                                { label: 'Week 2', val: 80 },
                                { label: 'Week 3', val: 45 },
                                { label: 'Week 4', val: 90 }
                            ].map((w, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '100%', height: `${w.val * 2}px`, background: '#EEF2FF', borderRadius: '0.75rem', position: 'relative' }}>
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', background: 'var(--accent-indigo)', borderRadius: '0.75rem' }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>{w.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ background: 'white', borderRadius: '1.25rem', border: '1px solid #E5E7EB', padding: '2rem' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.5rem' }}>Profit Summary</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #F3F4F6' }}>
                                <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>Gross Revenue</span>
                                <span style={{ fontWeight: '700', color: '#111827' }}>₱{summary.revenue.total.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #F3F4F6' }}>
                                <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>Operating Expenses</span>
                                <span style={{ fontWeight: '700', color: '#EF4444' }}>-₱{summary.expenses.gas.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
                                <span style={{ color: '#111827', fontWeight: '800' }}>Net Income</span>
                                <span style={{ fontWeight: '800', color: '#10B981', fontSize: '1.25rem' }}>₱{(summary.revenue.total - summary.expenses.gas).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                    </main>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;
