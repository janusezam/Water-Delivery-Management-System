import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { Truck, Search, Filter, Plus, Clock, CheckCircle, XCircle, LayoutGrid, ClipboardList, Eye, Settings, Trash2, Ban, Package } from 'lucide-react';
import { getOrders, createOrder, deleteOrder } from '../../services';
import OrderModal from '../../components/modals/OrderModal';
import StorefrontModal from '../../components/modals/StorefrontModal';
import ManageOrderModal from '../../components/modals/ManageOrderModal';
import TrackOrderModal from '../../components/modals/TrackOrderModal';
import CancelOrderModal from '../../components/modals/CancelOrderModal';

const OrdersPage = () => {
    const userProfile = JSON.parse(localStorage.getItem('user') || '{}');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStorefrontOpen, setIsStorefrontOpen] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [isTrackOpen, setIsTrackOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = async () => {
        try {
            const { data } = await getOrders();
            setOrders(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleDeleteOrder = async (orderId, orderShortId) => {
        if (!window.confirm(`Are you sure you want to permanently delete order #${orderShortId}? This cannot be undone.`)) return;
        try {
            await deleteOrder(orderId);
            fetchOrders();
        } catch (error) {
            console.error('Delete order error:', error);
            const errMsg = error.response?.data?.message || 'Failed to delete order';
            alert(errMsg);
        }
    };

    const handleCreateOrder = async (orderData) => {
        try {
            const payload = userProfile.role === 'user' 
                ? {
                    customerName: userProfile.name,
                    address: orderData.deliveryAddress,
                    items: orderData.items || [],
                    coordinates: { lat: 0, lng: 0 }
                  }
                : orderData;

            await createOrder(payload);
            setIsModalOpen(false);
            setIsStorefrontOpen(false);
            fetchOrders();
        } catch (error) {
            console.error('Order Submission Error:', error);
            alert('Failed to create order');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': 
                return { bg: 'var(--badge-yellow-bg)', color: '#D97706', icon: <Clock size={16} /> };
            case 'Dispatched':
            case 'dispatched': 
                return { bg: 'var(--badge-blue-bg)', color: '#4F46E5', icon: <Package size={16} /> };
            case 'Delivering': 
                return { bg: '#E0F2FE', color: '#0369A1', icon: <Truck size={16} style={{ animation: 'pulse 2s infinite' }} /> };
            case 'Completed':
            case 'delivered': 
                return { bg: 'var(--badge-green-bg)', color: '#10B981', icon: <CheckCircle size={16} /> };
            case 'Cancelled':
            case 'cancelled': 
                return { bg: 'var(--badge-red-bg)', color: '#EF4444', icon: <Ban size={16} /> };
            case 'Failed Attempt':
                return { bg: '#FFF1F2', color: '#E11D48', icon: <XCircle size={16} /> };
            default: 
                return { bg: 'var(--surface-hover)', color: 'var(--text-muted)', icon: <Clock size={16} /> };
        }
    };

    const completionStatuses = ['delivered', 'Completed', 'Cancelled', 'cancelled'];
    
    // For users, show all. For admin/staff, split by tab.
    const filteredOrders = userProfile.role === 'user' 
        ? orders 
        : (activeTab === 'active' 
            ? orders.filter(o => !completionStatuses.includes(o.status))
            : orders.filter(o => completionStatuses.includes(o.status))
          );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <Sidebar role={userProfile.role} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['Orders']} />

                <main style={{ padding: '2rem 3rem' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
                                {userProfile.role === 'user' ? 'My Orders' : 'Order Management'}
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
                                {userProfile.role === 'user' ? 'Track your delivery orders.' : 'Manage all delivery requests and their statuses.'}
                            </p>
                        </div>
                        <button 
                            onClick={() => {
                                if (userProfile.role === 'user') {
                                    setIsStorefrontOpen(true);
                                } else {
                                    setIsModalOpen(true);
                                }
                            }}
                            className="btn-primary" 
                            style={{ background: '#4F46E5', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontWeight: '600', color: 'white', border: 'none', cursor: 'pointer' }}
                        >
                            <Plus size={20} />
                            <span>{userProfile.role === 'user' ? 'New Request' : 'Create Delivery'}</span>
                        </button>
                    </header>

                    {/* Tabs for Admin/Staff */}
                    {userProfile.role !== 'user' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--surface-bg)', borderRadius: '1rem', padding: '0.375rem', border: '1px solid var(--border-light)', width: 'fit-content' }}>
                            <button
                                onClick={() => setActiveTab('active')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.625rem 1.25rem', borderRadius: '0.75rem', border: 'none',
                                    fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
                                    background: activeTab === 'active' ? '#4F46E5' : 'transparent',
                                    color: activeTab === 'active' ? 'white' : '#6B7280',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <ClipboardList size={16} /> Active Orders
                            </button>
                            <button
                                onClick={() => setActiveTab('completed')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.625rem 1.25rem', borderRadius: '0.75rem', border: 'none',
                                    fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer',
                                    background: activeTab === 'completed' ? '#10B981' : 'transparent',
                                    color: activeTab === 'completed' ? 'white' : '#6B7280',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <CheckCircle size={16} /> Complete Orders
                            </button>
                        </div>
                    )}

                    <div className="glass" style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ position: 'relative', width: '320px' }}>
                                <Search style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-light)' }} size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search by customer or order ID..." 
                                    style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span style={{ padding: '0.5rem 1rem', background: 'var(--surface-hover)', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                                    {filteredOrders.length} {activeTab === 'active' ? 'Active' : 'Complete'} Orders
                                </span>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--page-bg)', borderBottom: '1px solid var(--surface-hover)' }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order ID</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Address</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Items</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Driver</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                                    const style = getStatusStyle(order.status);
                                    const isCompleteView = completionStatuses.includes(order.status);
                                    
                                    return (
                                        <tr key={order._id} style={{ borderBottom: '1px solid var(--surface-hover)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#4F46E5' }}>#{order._id.slice(-6).toUpperCase()}</td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{order.customerName || order.customer?.name}</div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', maxWidth: '200px' }}>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.address || order.deliveryAddress}</div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {(() => {
                                                    if (!order.items) return 'No items';
                                                    if (typeof order.items === 'string') return order.items;
                                                    if (Array.isArray(order.items)) {
                                                        return order.items.map(i => {
                                                            const name = i.product?.name || i.productName || 'Product';
                                                            return `${i.qty}x ${name} (${i.payDeposit ? 'Deposit' : 'No Deposit'})`;
                                                        }).join(', ');
                                                    }
                                                    return 'Invalid format';
                                                })()}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>₱{order.totalAmount}</td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '0.375rem', 
                                                    padding: '0.375rem 0.75rem', 
                                                    borderRadius: '1rem', 
                                                    width: 'fit-content',
                                                    fontSize: '0.75rem', 
                                                    fontWeight: '700',
                                                    background: style.bg,
                                                    color: style.color,
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {style.icon}
                                                    {order.status}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {order.assignedDriver ? (order.assignedDriver.name || order.assignedDriver.user?.name || 'Assigned') : 'Not Assigned'}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    {userProfile.role === 'user' ? (
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={() => { setSelectedOrder(order); setIsTrackOpen(true); }}
                                                                title="View Details"
                                                                style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #C7D2FE', background: 'var(--badge-blue-bg)', color: '#4F46E5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            {order.status === 'Pending' && (
                                                                <button
                                                                    onClick={() => { setSelectedOrder(order); setIsCancelOpen(true); }}
                                                                    title="Cancel Order"
                                                                    style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #FEE2E2', background: 'var(--badge-red-bg)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                                >
                                                                    <Ban size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        activeTab === 'completed' ? (
                                                            <button
                                                                onClick={() => { setSelectedOrder(order); setIsTrackOpen(true); }}
                                                                title="View Details"
                                                                style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #C7D2FE', background: 'var(--badge-blue-bg)', color: '#4F46E5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => { setSelectedOrder(order); setIsManageOpen(true); }}
                                                                    title="Manage Order"
                                                                    style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: '#4F46E5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                                >
                                                                    <Settings size={16} />
                                                                </button>
                                                                {userProfile.role === 'admin' && (
                                                                    (() => {
                                                                        const protectedStatuses = ['Dispatched', 'dispatched', 'Delivering', 'Completed', 'delivered'];
                                                                        const isProtected = protectedStatuses.includes(order.status);
                                                                        return (
                                                                            <button
                                                                                onClick={() => !isProtected && handleDeleteOrder(order._id, order._id.slice(-6).toUpperCase())}
                                                                                disabled={isProtected}
                                                                                title={isProtected ? "Cannot delete active or completed orders" : "Delete Order"}
                                                                                style={{ 
                                                                                    padding: '0.5rem', borderRadius: '0.5rem', 
                                                                                    border: isProtected ? '1px solid var(--border-medium)' : '1px solid #FEE2E2', 
                                                                                    background: isProtected ? 'var(--surface-hover)' : 'var(--badge-red-bg)', 
                                                                                    color: isProtected ? 'var(--text-light)' : '#EF4444', 
                                                                                    cursor: isProtected ? 'not-allowed' : 'pointer',
                                                                                    opacity: isProtected ? 0.6 : 1,
                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                                                                }}
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        );
                                                                    })()
                                                                )}
                                                            </>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
                                            {loading ? 'Loading orders...' : `No ${activeTab} orders found.`}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>

            {isModalOpen && (
                <OrderModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleCreateOrder}
                    isCustomer={userProfile.role === 'user'}
                />
            )}

            {isStorefrontOpen && (
                <StorefrontModal
                    isOpen={isStorefrontOpen}
                    onClose={() => setIsStorefrontOpen(false)}
                    onSave={handleCreateOrder}
                />
            )}
            {isManageOpen && (
                <ManageOrderModal 
                    isOpen={isManageOpen}
                    onClose={() => setIsManageOpen(false)}
                    order={selectedOrder}
                    onUpdate={fetchOrders}
                />
            )}
            {isTrackOpen && (
                <TrackOrderModal
                    isOpen={isTrackOpen}
                    onClose={() => setIsTrackOpen(false)}
                    order={selectedOrder}
                />
            )}
            {isCancelOpen && (
                <CancelOrderModal
                    isOpen={isCancelOpen}
                    onClose={() => setIsCancelOpen(false)}
                    order={selectedOrder}
                    onCancelSuccess={fetchOrders}
                />
            )}
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default OrdersPage;
