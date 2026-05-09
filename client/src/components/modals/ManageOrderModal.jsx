import React, { useState, useEffect } from 'react';
import { X, Truck, User, MapPin, Package, CheckCircle2 } from 'lucide-react';
import { getUsers, updateOrder } from '../../services';
import { toast } from 'react-hot-toast';

const ManageOrderModal = ({ isOpen, onClose, order, onUpdate }) => {
    const [drivers, setDrivers] = useState([]);
    const [status, setStatus] = useState(order?.status || 'Pending');
    const [assignedDriver, setAssignedDriver] = useState(order?.assignedDriver?._id || order?.assignedDriver || '');
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

    const statusOptions = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content" style={{
                background: 'white', padding: '2rem', borderRadius: '1.5rem',
                width: '500px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                    <X size={24} />
                </button>

                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>Manage Order</h3>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '2rem' }}>Order ID: <span style={{ color: '#4F46E5', fontWeight: '700' }}>#{order._id.slice(-6).toUpperCase()}</span></p>

                <div style={{ background: '#F9FAFB', padding: '1.25rem', borderRadius: '1rem', marginBottom: '2rem', border: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                        <User size={18} color="#6B7280" />
                        <div>
                            <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>Customer</p>
                            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827', margin: 0 }}>{order.customerName}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                        <MapPin size={18} color="#6B7280" />
                        <div>
                            <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>Delivery Address</p>
                            <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>{order.address}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Package size={18} color="#6B7280" />
                        <div>
                            <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>Items</p>
                            <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>
                                {Array.isArray(order.items) 
                                    ? order.items.map(i => `${i.qty}x ${i.productName || 'Water'} (${i.payDeposit ? 'Deposit' : 'No Deposit'})`).join(', ')
                                    : order.items || 'No items'}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#374151', marginBottom: '0.5rem' }}>Order Status</label>
                        <select 
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid #D1D5DB', background: 'white', outline: 'none' }}
                        >
                            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', color: '#374151', marginBottom: '0.5rem' }}>Assign Driver</label>
                        <select 
                            value={assignedDriver}
                            onChange={(e) => setAssignedDriver(e.target.value)}
                            style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid #D1D5DB', background: 'white', outline: 'none' }}
                        >
                            <option value="">-- Select a Driver --</option>
                            {drivers.map(d => (
                                <option key={d._id} value={d._id}>
                                    {d.name} ({d.email})
                                </option>
                            ))}
                        </select>
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
