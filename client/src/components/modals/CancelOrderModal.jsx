import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const CancelOrderModal = ({ isOpen, onClose, order, onCancelSuccess }) => {
    const [reason, setReason] = useState('Changed my mind');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !order) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${order._id}`, {
                status: 'Cancelled',
                cancelReason: reason,
                cancelMessage: message
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onCancelSuccess();
            onClose();
        } catch (error) {
            console.error('Cancellation error:', error);
            alert(error.response?.data?.message || 'Failed to cancel order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                width: '90vw', maxWidth: '450px', background: 'var(--input-bg)', borderRadius: '1.5rem',
                padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                animation: 'modalSlideUp 0.3s ease-out'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: 'var(--badge-red-bg)', borderRadius: '0.5rem' }}>
                            <AlertTriangle size={20} color="#EF4444" />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.25rem', color: 'var(--text-main)' }}>Cancel Order</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={24} /></button>
                </div>
                
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Are you sure you want to cancel order <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>#{order._id.slice(-6).toUpperCase()}</span>? This action cannot be undone.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Reason for cancellation</label>
                        <select 
                            value={reason} 
                            onChange={e => setReason(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-medium)', fontSize: '0.9rem', outline: 'none' }}
                        >
                            <option value="Changed my mind">Changed my mind</option>
                            <option value="Found a better price">Found a better price</option>
                            <option value="Ordered by mistake">Ordered by mistake</option>
                            <option value="Delivery takes too long">Delivery takes too long</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Additional Message (Optional)</label>
                        <textarea 
                            value={message} 
                            onChange={e => setMessage(e.target.value)}
                            rows={3}
                            placeholder="Tell us more about why you're cancelling..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-medium)', fontSize: '0.9rem', outline: 'none', resize: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <button 
                            type="button"
                            onClick={onClose}
                            style={{ flex: 1, padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'var(--input-bg)', color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Keep Order
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{
                                flex: 1, padding: '0.875rem', background: '#EF4444', color: 'white', borderRadius: '0.75rem',
                                fontWeight: '700', border: 'none', cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Cancelling...' : 'Confirm Cancel'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes modalSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default CancelOrderModal;
