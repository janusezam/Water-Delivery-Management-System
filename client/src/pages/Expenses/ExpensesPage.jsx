import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { CreditCard, Plus, Calendar, Search, Edit, Trash2, CheckCircle, AlertTriangle, Download, X } from 'lucide-react';
import { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseSummary, exportExpenses } from '../../services';
import ExpenseModal from '../../components/modals/ExpenseModal';
import Toast from '../../components/common/Toast';

const ExpensesPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isDriver = user.role === 'driver';
    const isAdmin = user.role === 'admin';
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;

            const [expensesRes, summaryRes] = await Promise.all([
                getExpenses(params),
                isAdmin ? getExpenseSummary(params) : Promise.resolve({ data: null })
            ]);

            if (isDriver) {
                setExpenses(expensesRes.data.filter(e => e.driver?.user?._id === user._id));
            } else {
                setExpenses(expensesRes.data);
            }

            if (isAdmin) {
                setSummary(summaryRes.data);
            }
        } catch (error) {
            console.error('Error fetching expenses', error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateFrom, dateTo]);

    const handleSaveExpense = async (formData) => {
        try {
            if (editingExpense) {
                await updateExpense(editingExpense._id, formData);
                showToast('Expense updated successfully');
            } else {
                await createExpense(formData);
                showToast('Expense logged successfully');
            }
            setIsModalOpen(false);
            setEditingExpense(null);
            fetchData();
        } catch (error) {
            showToast(editingExpense ? 'Failed to update expense' : 'Failed to log expense', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await deleteExpense(id);
                showToast('Expense deleted');
                fetchData();
            } catch (error) {
                showToast('Failed to delete expense', 'error');
            }
        }
    };

    const handleToggleReviewed = async (expense) => {
        try {
            await updateExpense(expense._id, { is_reviewed: !expense.is_reviewed });
            showToast(`Expense marked as ${!expense.is_reviewed ? 'reviewed' : 'unreviewed'}`);
            fetchData();
        } catch (error) {
            showToast('Failed to update review status', 'error');
        }
    };

    const handleExport = async () => {
        try {
            const params = {};
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;

            const response = await exportExpenses(params);
            
            // Create a blob from the response and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'gas_expenses.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            showToast('Failed to export CSV', 'error');
        }
    };

    const openEditModal = (expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    // Client-side search filtering
    const filteredExpenses = expenses.filter(expense => 
        !searchQuery || 
        expense.driver?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.fuel_station?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Highlight style
    const getRowStyle = (expense) => {
        return { borderBottom: '1px solid var(--surface-hover)' };
    };

    return (
        <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <Sidebar role={user.role} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['Gas Expenses']} />

                <main className="content" style={{ padding: '2rem 3rem', animation: 'fadeIn 0.5s ease-out', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>Gas Expenses</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
                                {isDriver ? 'Track your fuel costs and maintenance records.' : 'Monitor fuel costs and efficiency across the fleet.'}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {isAdmin && (
                                <button 
                                    onClick={handleExport}
                                    style={{ 
                                        background: 'var(--surface-bg)', color: 'var(--text-muted)', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', 
                                        border: '1px solid var(--border-light)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', 
                                        cursor: 'pointer', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                    }}
                                >
                                    <Download size={18} />
                                    <span>Export CSV</span>
                                </button>
                            )}
                            <button 
                                onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
                                style={{ 
                                    background: '#4F46E5', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', 
                                    border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', 
                                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                                }}
                            >
                                <Plus size={20} />
                                <span>Log Expense</span>
                            </button>
                        </div>
                    </header>

                    {isAdmin && summary && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            <div className="glass" style={{ background: 'var(--surface-bg)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border-light)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Spend</p>
                                <p style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)' }}>₱{(summary.total_spend || 0).toLocaleString()}</p>
                            </div>
                            <div className="glass" style={{ background: 'var(--surface-bg)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border-light)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Liters</p>
                                <p style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)' }}>{(summary.total_liters || 0).toLocaleString()}L</p>
                            </div>
                            <div className="glass" style={{ background: 'var(--surface-bg)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border-light)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Avg Price / Liter</p>
                                <p style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)' }}>{summary.avg_price_per_liter ? `₱${summary.avg_price_per_liter}` : 'N/A'}</p>
                            </div>
                            <div className="glass" style={{ background: 'var(--surface-bg)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border-light)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Fill-ups</p>
                                <p style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)' }}>{summary.number_of_fillups || 0}</p>
                            </div>
                            <div className="glass" style={{ background: 'var(--surface-bg)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border-light)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Cost per Gallon</p>
                                <p style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)' }}>
                                    {summary.fuel_cost_per_gallon_delivered ? `₱${summary.fuel_cost_per_gallon_delivered}` : <span style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>N/A (No deliveries)</span>}
                                </p>
                            </div>
                        </div>
                    )}


                    <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--surface-hover)', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ position: 'relative', width: '320px', flex: '1 1 auto', maxWidth: '400px' }}>
                                <Search style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-light)' }} size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search driver or station..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.9rem' }}
                                />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Filter Date:</span>
                                <input 
                                    type="date" 
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    style={{ padding: '0.625rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.9rem' }}
                                />
                                <span style={{ color: 'var(--text-light)' }}>to</span>
                                <input 
                                    type="date" 
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    style={{ padding: '0.625rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.9rem' }}
                                />
                                {(dateFrom || dateTo) && (
                                    <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}>
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                                <thead style={{ background: 'var(--page-bg)', borderBottom: '1px solid var(--surface-hover)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                                        {!isDriver && <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Driver</th>}
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Station</th>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Volume & Price</th>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Odometer</th>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cost</th>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Receipt</th>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                                        <tr key={expense._id} style={getRowStyle(expense)}>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
                                                    <Calendar size={16} color="var(--text-light)" />
                                                    {new Date(expense.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            {!isDriver && (
                                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: '28px', height: '28px', background: 'var(--badge-blue-bg)', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#4F46E5' }}>
                                                            {expense.driver?.user?.name?.[0] || '?'}
                                                        </div>
                                                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{expense.driver?.user?.name || 'Unknown'}</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                {expense.fuel_station || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Not specified</span>}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{expense.liters}L</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@ ₱{expense.pricePerLiter.toFixed(2)}/L</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                {expense.odometer ? (
                                                    <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{expense.odometer.toLocaleString()} km</span>
                                                ) : <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>N/A</span>}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#EF4444' }}>₱{expense.totalCost.toFixed(2)}</td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                {expense.createdBy?.role === 'admin' ? (
                                                    <span style={{ background: 'var(--badge-blue-bg)', color: '#3b82f6', padding: '0.25rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <CheckCircle size={12} /> Logged by Admin
                                                    </span>
                                                ) : expense.is_reviewed ? (
                                                    <span style={{ background: 'var(--badge-green-bg)', color: '#10B981', padding: '0.25rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <CheckCircle size={12} /> Reviewed
                                                    </span>
                                                ) : (
                                                    <span style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', padding: '0.25rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600' }}>
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                                {expense.receiptPhoto ? (
                                                    <img 
                                                        src={expense.receiptPhoto} 
                                                        alt="Receipt" 
                                                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '0.5rem', cursor: 'pointer', border: '1px solid var(--border-light)' }}
                                                        onClick={() => setLightboxImage(expense.receiptPhoto)}
                                                    />
                                                ) : <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>—</span>}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    {isAdmin && expense.createdBy?.role !== 'admin' && (
                                                        <button 
                                                            onClick={() => handleToggleReviewed(expense)}
                                                            title={expense.is_reviewed ? "Mark as Unreviewed" : "Mark as Reviewed"}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: expense.is_reviewed ? '#10B981' : '#9CA3AF', padding: '0.25rem' }}
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    {(!expense.is_reviewed || isAdmin) && (
                                                        <button 
                                                            onClick={() => openEditModal(expense)}
                                                            title="Edit"
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', padding: '0.25rem' }}
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <button 
                                                            onClick={() => handleDelete(expense._id)}
                                                            title="Delete"
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '0.25rem' }}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={isDriver ? "8" : "9"} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-light)' }}>
                                                {loading ? 'Fetching records...' : 'No expenses found.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            <ExpenseModal 
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingExpense(null); }}
                onSave={handleSaveExpense}
                expense={editingExpense}
            />

            {/* Lightbox for receipt viewing */}
            {lightboxImage && (
                <div 
                    onClick={() => setLightboxImage(null)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}
                >
                    <button 
                        onClick={() => setLightboxImage(null)}
                        style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                    >
                        <X size={32} />
                    </button>
                    <img 
                        src={lightboxImage} 
                        alt="Receipt Full View" 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '0.5rem' }}
                        onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking image
                    />
                </div>
            )}

            <Toast 
                {...toast} 
                onClose={() => setToast({ ...toast, show: false })} 
            />
        </div>
    );
};

export default ExpensesPage;
