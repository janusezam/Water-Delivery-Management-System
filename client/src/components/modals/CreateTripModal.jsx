import React, { useState, useEffect } from 'react';
import { X, Truck, Package } from 'lucide-react';
import { getDrivers, getOrders } from '../../services';

const CreateTripModal = ({ isOpen, onClose, onSave }) => {
    const [drivers, setDrivers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        driverId: '',
        orderIds: [],
        startKm: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchData();
        } else {
            // Reset form when closed
            setFormData({ driverId: '', orderIds: [], startKm: '' });
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [driversRes, ordersRes] = await Promise.all([
                getDrivers(),
                getOrders()
            ]);
            
            // Only show available drivers
            const availableDrivers = driversRes.data.filter(d => d.status === 'available');
            setDrivers(availableDrivers);
            
            // Only show pending orders that are for delivery
            // Assuming deliveryType exists, or just pending orders
            const pendingOrders = ordersRes.data.filter(o => o.status === 'pending');
            setOrders(pendingOrders);
            
            if (availableDrivers.length > 0) {
                setFormData(prev => ({ ...prev, driverId: availableDrivers[0]._id }));
            }
        } catch (error) {
            console.error('Error fetching data for trip modal:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const toggleOrderSelection = (orderId) => {
        setFormData(prev => {
            const isSelected = prev.orderIds.includes(orderId);
            if (isSelected) {
                return { ...prev, orderIds: prev.orderIds.filter(id => id !== orderId) };
            } else {
                return { ...prev, orderIds: [...prev.orderIds, orderId] };
            }
        });
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content glass" style={{
                background: 'var(--surface-bg)',
                padding: '2rem',
                borderRadius: '1.5rem',
                width: '500px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                border: '1px solid var(--border-light)'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={24} />
                </button>
                
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Truck size={24} color="var(--accent-indigo)" />
                    Dispatch New Trip
                </h3>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading drivers and orders...</div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Assign Driver</label>
                            {drivers.length === 0 ? (
                                <p style={{ color: 'var(--error-red)', fontSize: '0.85rem' }}>No available drivers found.</p>
                            ) : (
                                <select 
                                    required
                                    className="input-field"
                                    value={formData.driverId}
                                    onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--page-bg)' }}
                                >
                                    <option value="" disabled>Select a driver...</option>
                                    {drivers.map(d => (
                                        <option key={d._id} value={d._id}>{d.user?.name || 'Unknown'} - {d.vehicleType}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Starting Odometer (Km)</label>
                            <input 
                                type="number" 
                                required
                                min="0"
                                className="input-field"
                                value={formData.startKm}
                                onChange={(e) => setFormData({...formData, startKm: e.target.value})}
                                placeholder="e.g. 45000"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--page-bg)' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                                <span>Select Pending Orders</span>
                                <span style={{ color: 'var(--accent-indigo)' }}>{formData.orderIds.length} Selected</span>
                            </label>
                            
                            {orders.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', background: 'var(--page-bg)', borderRadius: '0.5rem', textAlign: 'center' }}>No pending orders available.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {orders.map(order => (
                                        <div 
                                            key={order._id}
                                            onClick={() => toggleOrderSelection(order._id)}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '1rem', 
                                                padding: '0.75rem', 
                                                borderRadius: '0.5rem', 
                                                border: `1px solid ${formData.orderIds.includes(order._id) ? 'var(--accent-indigo)' : 'var(--border-light)'}`,
                                                background: formData.orderIds.includes(order._id) ? 'var(--badge-blue-bg)' : 'var(--page-bg)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <input 
                                                type="checkbox" 
                                                checked={formData.orderIds.includes(order._id)}
                                                readOnly
                                                style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--accent-indigo)', cursor: 'pointer' }}
                                            />
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customer?.name}</p>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.deliveryAddress}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-main)' }}>₱{order.totalAmount}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={formData.orderIds.length === 0 || drivers.length === 0}
                            style={{ 
                                marginTop: '0.5rem', 
                                padding: '1rem', 
                                borderRadius: '0.75rem', 
                                background: formData.orderIds.length === 0 || drivers.length === 0 ? 'var(--text-light)' : 'var(--accent-indigo)', 
                                color: 'white', 
                                fontWeight: '800', 
                                border: 'none', 
                                cursor: formData.orderIds.length === 0 || drivers.length === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Truck size={18} />
                            Dispatch Trip
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreateTripModal;
