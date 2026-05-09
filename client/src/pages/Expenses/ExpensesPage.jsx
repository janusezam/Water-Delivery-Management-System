import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { CreditCard, Plus, Receipt, Calendar, User, Search } from 'lucide-react';
import { getExpenses, createExpense } from '../../services';
import ExpenseModal from '../../components/modals/ExpenseModal';
import Toast from '../../components/common/Toast';

const ExpensesPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Get user from local storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isDriver = user.role === 'driver';
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchExpenses = async () => {
        try {
            const { data } = await getExpenses();
            // If driver, only show their own expenses
            if (isDriver) {
                setExpenses(data.filter(e => e.driver?.user?._id === user._id));
            } else {
                setExpenses(data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching expenses', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleSaveExpense = async (formData) => {
        try {
            await createExpense(formData);
            showToast('Expense logged successfully');
            setIsModalOpen(false);
            fetchExpenses();
        } catch (error) {
            showToast('Failed to log expense', 'error');
        }
    };

    return (
        <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
            <Sidebar role={user.role} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['Gas Expenses']} />

                <main className="content" style={{ padding: '2rem 3rem', animation: 'fadeIn 0.5s ease-out' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#111827', letterSpacing: '-0.025em' }}>Gas Expenses</h2>
                            <p style={{ color: '#6B7280', fontSize: '0.925rem' }}>
                                {isDriver ? 'Track your fuel costs and maintenance records.' : 'Monitor fuel costs across all active vehicles.'}
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            style={{ 
                                background: '#4F46E5', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', 
                                border: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', 
                                cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                            }}
                        >
                            <Plus size={20} />
                            <span>Log Expense</span>
                        </button>
                    </header>

                    <div style={{ background: 'white', borderRadius: '1.25rem', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ position: 'relative', width: '320px' }}>
                                <Search style={{ position: 'absolute', top: '10px', left: '12px', color: '#9CA3AF' }} size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search by date or cost..." 
                                    style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.75rem', border: '1px solid #E5E7EB', outline: 'none', fontSize: '0.9rem' }}
                                />
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Date</th>
                                    {!isDriver && <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Driver</th>}
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Liters</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Price/L</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Total Cost</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', textAlign: 'right' }}>Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.length > 0 ? expenses.map((expense) => (
                                    <tr key={expense._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151', fontSize: '0.9rem', fontWeight: '600' }}>
                                                <Calendar size={16} color="#9CA3AF" />
                                                {new Date(expense.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        {!isDriver && (
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '28px', height: '28px', background: '#F3F4F6', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#4F46E5' }}>
                                                        {expense.driver?.user?.name[0]}
                                                    </div>
                                                    <span style={{ fontWeight: '600', color: '#111827' }}>{expense.driver?.user?.name}</span>
                                                </div>
                                            </td>
                                        )}
                                        <td style={{ padding: '1.25rem 1.5rem', color: '#4B5563', fontSize: '0.9rem' }}>{expense.liters}L</td>
                                        <td style={{ padding: '1.25rem 1.5rem', color: '#4B5563', fontSize: '0.9rem' }}>₱{expense.pricePerLiter.toFixed(2)}</td>
                                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#EF4444' }}>₱{expense.totalCost.toFixed(2)}</td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                            {expense.receiptPhoto ? (
                                                <a href={expense.receiptPhoto} target="_blank" rel="noreferrer" style={{ color: '#4F46E5', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none' }}>
                                                    View Receipt
                                                </a>
                                            ) : <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>No Photo</span>}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: '#9CA3AF' }}>
                                            {loading ? 'Fetching records...' : 'No expenses logged yet.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>

            <ExpenseModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveExpense}
            />

            <Toast 
                {...toast} 
                onClose={() => setToast({ ...toast, show: false })} 
            />
        </div>
    );
};

export default ExpensesPage;
