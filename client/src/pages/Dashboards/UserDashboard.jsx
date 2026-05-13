import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { ShoppingBag, ShoppingCart, Clock, User, LogOut, Plus, Truck, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getOrders, createOrder } from '../../services';

const UserDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchOrders = async () => {
        try {
            const { data } = await getOrders();
            // Filter orders to only show this user's orders
            const myOrders = data.filter(o => o.customer?._id === user._id || o.customer === user._id);
            setOrders(myOrders);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching user orders:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [user._id]);

    const handleCreateOrder = async (orderData) => {
        try {
            const payload = {
                customerName: user.name,
                address: orderData.deliveryAddress,
                items: orderData.items.map(item => {
                    const productLabel = item.productName || 'Water';
                    return `${item.qty}x ${productLabel}`;
                }).join(', '),
                coordinates: { lat: 0, lng: 0 }
            };
            
            await createOrder(payload);
            setIsStorefrontOpen(false);
            fetchOrders();
        } catch (error) {
            console.error('Dashboard Order Error:', error);
            alert('Failed to place order');
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <Sidebar role="user" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['My Dashboard']} />

                <main style={{ padding: '2rem' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>My Orders</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ready for a refill, {user.name ? user.name.split(' ')[0] : 'Customer'}?</p>
                        </div>
                        <button 
                            className="btn-primary" 
                            onClick={() => navigate('/products')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#4F46E5' }}>
                            <Plus size={20} />
                            New Delivery Order
                        </button>
                    </header>

                    {loading ? (
                        <div style={{ display: 'grid', placeItems: 'center', height: '200px' }}>
                            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #EEF2FF', borderTopColor: '#4F46E5', borderRadius: '50%' }}></div>
                        </div>
                    ) : orders.length === 0 ? (
                        <div style={{ background: 'var(--surface-bg)', borderRadius: '1rem', border: '1px solid var(--border-light)', padding: '4rem 2rem', textAlign: 'center' }}>
                            <div style={{ marginBottom: '1.5rem', opacity: 0.1, color: '#4F46E5' }}>
                                <ShoppingCart size={80} style={{ margin: '0 auto' }} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No active orders</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You haven't placed any delivery orders yet.</p>
                            <button 
                                onClick={() => navigate('/orders')}
                                style={{ 
                                    background: 'var(--surface-bg)', color: '#4F46E5', border: '1px solid #4F46E5', 
                                    padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: '700', cursor: 'pointer' 
                                }}>
                                Browse Products
                            </button>
                        </div>
                    ) : (
                        <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', padding: '1.5rem', borderBottom: '1px solid var(--surface-hover)', color: 'var(--text-main)' }}>Order History</h4>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {orders.map((order, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: i === orders.length - 1 ? 'none' : '1px solid var(--surface-hover)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            <div style={{ padding: '0.75rem', background: 'var(--badge-blue-bg)', borderRadius: '1rem' }}><Truck size={22} color="#4F46E5" /></div>
                                            <div>
                                                <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                                    {order.items.map((item, idx) => (
                                                        <span key={idx} style={{ display: 'block' }}>
                                                            {item.qty}x {item.product?.name || 'Water'}
                                                            <span style={{ fontSize: '0.7rem', color: '#4F46E5', fontWeight: '700', marginLeft: '0.25rem' }}>({item.payDeposit ? 'Deposit' : 'No Deposit'})</span>
                                                            {idx < order.items.length - 1 ? ', ' : ''}
                                                        </span>
                                                    ))}
                                                </p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    Total: ₱{order.totalAmount.toFixed(2)} • {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span style={{ 
                                            fontSize: '0.75rem', 
                                            fontWeight: '700', 
                                            color: order.status === 'delivered' ? '#10B981' : (order.status === 'on-the-way' ? '#4F46E5' : '#F59E0B'),
                                            background: order.status === 'delivered' ? '#ECFDF5' : (order.status === 'on-the-way' ? '#EEF2FF' : '#FFFBEB'),
                                            padding: '0.375rem 0.875rem', 
                                            borderRadius: '1.25rem',
                                            textTransform: 'capitalize'
                                        }}>
                                            {order.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>

        </div>
    );
};

export default UserDashboard;
