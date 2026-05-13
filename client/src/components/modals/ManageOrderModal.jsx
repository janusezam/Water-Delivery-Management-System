import React, { useState, useEffect } from 'react';
import { X, Truck, User, MapPin, Package, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getUsers, updateOrder } from '../../services';
import { toast } from 'react-hot-toast';

const ManageOrderModal = ({ isOpen, onClose, order, onUpdate }) => {
    const [drivers, setDrivers] = useState([]);
    const [status, setStatus] = useState(order?.status || 'Pending');
    const [assignedDriver, setAssignedDriver] = useState(order?.assignedDriver?._id || order?.assignedDriver || '');
    const [overrideStatus, setOverrideStatus] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchDrivers = async () => {
                try {
                    const { data } = await getUsers();
                    const driverUsers = data.filter(u => u.role === 'driver');
                    setDrivers(driverUsers);
                } catch (error) {
                    console.error('Error fetching drivers:', error);
                }
            };
            fetchDrivers();
            setStatus(order?.status || 'Pending');
            setAssignedDriver(order?.assignedDriver?._id || order?.assignedDriver || '');
        }
    }, [isOpen, order]);

    if (!isOpen || !order) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateOrder(order._id, {
                status,
                assignedDriver: assignedDriver || null
            });
            toast.success('Order updated successfully');
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Update Order Error:', error);
            toast.error('Failed to update order');
        } finally {
            setLoading(false);
        }
    };

    const statusOptions = ['Pending', 'Dispatched', 'Delivering', 'Completed', 'Cancelled', 'Failed Attempt'];

    const handleStatusChange = (newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'Cancelled') {
            setAssignedDriver('');
        }
    };

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [showAdvanced, setShowAdvanced] = useState(false);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content" style={{
                background: 'var(--input-bg)', padding: '2rem', borderRadius: '1.5rem',
                width: '500px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                    <X size={24} />
                </button>

                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Manage Order</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>Order ID: <span style={{ color: '#4F46E5', fontWeight: '700' }}>#{order._id.slice(-6).toUpperCase()}</span></p>

                <div style={{ background: 'var(--page-bg)', padding: '1.25rem', borderRadius: '1rem', marginBottom: '2rem', border: '1px solid var(--surface-hover)' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                        <User size={18} color="var(--text-muted)" />
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Customer</p>
                            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{order.customerName}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                        <MapPin size={18} color="var(--text-muted)" />
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Delivery Address</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', margin: 0 }}>{order.address}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Package size={18} color="var(--text-muted)" />
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Items</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', margin: 0 }}>
                                {Array.isArray(order.items) 
                                    ? order.items.map(i => `${i.qty}x ${i.productName || 'Water'} (${i.payDeposit ? 'Deposit' : 'No Deposit'})`).join(', ')
                                    : order.items || 'No items'}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {order?.status === 'Failed Attempt' && (
                        <div style={{ background: 'var(--badge-red-bg)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #FECACA', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626', fontWeight: '700', marginBottom: '0.25rem' }}>
                                <AlertTriangle size={16} /> Delivery Failed
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#991B1B' }}><strong>Reason:</strong> {order.failedReason}</p>
                            {order.failedNote && <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#991B1B' }}><strong>Note:</strong> {order.failedNote}</p>}
                        </div>
                    )}

                    {order?.status === 'Cancelled' && (order.cancelReason || order.cancelMessage) && (
                        <div style={{ background: 'var(--badge-red-bg)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #FECACA', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626', fontWeight: '700', marginBottom: '0.25rem' }}>
                                <AlertTriangle size={16} /> Cancellation Details
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#991B1B' }}><strong>Reason:</strong> {order.cancelReason || 'Not specified'}</p>
                            {order.cancelMessage && <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#991B1B' }}><strong>Message:</strong> {order.cancelMessage}</p>}
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Order Status</label>
                        <select 
                            value={status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', outline: 'none' }}
                        >
                            {statusOptions.map(opt => {
                                const isDriverOnlyStatus = ['Delivering', 'Completed', 'Failed Attempt', 'delivered'].includes(opt);
                                const isDisabled = !overrideStatus && (
                                    (assignedDriver && isDriverOnlyStatus && order?.status !== opt) || 
                                    (!assignedDriver && isDriverOnlyStatus)
                                );
                                return <option key={opt} value={opt} disabled={isDisabled}>{opt}</option>;
                            })}
                        </select>
                        
                        {/* Admin-only Override section */}
                        {currentUser.role === 'admin' && assignedDriver && (
                            <div style={{ marginTop: '0.75rem' }}>
                                <button 
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                    {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
                                </button>
                                
                                {showAdvanced && (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#EF4444', marginTop: '0.5rem', padding: '0.75rem', background: 'var(--badge-red-bg)', borderRadius: '0.75rem', border: '1px dashed #FECACA' }}>
                                        <input type="checkbox" checked={overrideStatus} onChange={e => setOverrideStatus(e.target.checked)} />
                                        Override Driver Workflow (Allow direct status changes)
                                    </label>
                                )}
                            </div>
                        )}

                        {!assignedDriver && (
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                                * Assign a driver to enable "Delivering" or "Completed" statuses.
                            </p>
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Assign Driver</label>
                        <select 
                            value={assignedDriver}
                            onChange={(e) => setAssignedDriver(e.target.value)}
                            disabled={status === 'Cancelled' || status === 'Pending'}
                            style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-medium)', background: (status === 'Cancelled' || status === 'Pending') ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none' }}
                        >
                            <option value="">-- Select a Driver --</option>
                            {drivers.map(d => (
                                <option key={d._id} value={d._id}>
                                    {d.name} ({d.email})
                                </option>
                            ))}
                        </select>
                        {status === 'Cancelled' && (
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#EF4444' }}>
                                Driver assignment is disabled for cancelled orders.
                            </p>
                        )}
                        {status === 'Pending' && (
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#4F46E5', fontWeight: '600' }}>
                                * Dispatch the order first to assign a driver.
                            </p>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn-primary" 
                        style={{ 
                            padding: '1rem', borderRadius: '1rem', background: '#4F46E5', color: 'white', 
                            fontWeight: '700', border: 'none', cursor: 'pointer', marginTop: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                    >
                        {loading ? 'Updating...' : <><CheckCircle2 size={20} /> Update Order</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ManageOrderModal;
