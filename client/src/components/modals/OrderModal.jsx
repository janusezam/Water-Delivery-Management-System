import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Package, User as UserIcon, MapPin, ShoppingBag } from 'lucide-react';
import { getCustomers, getProducts, getUsers } from '../../services';

const OrderModal = ({ isOpen, onClose, onSave, isCustomer = false }) => {
    const [customers, setCustomers] = useState([]);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [orderItems, setOrderItems] = useState([{ product: '', qty: 1, price: 0, payDeposit: false, depositAmount: 0 }]);
    const [customerAddress, setCustomerAddress] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [custRes, prodRes, userRes] = await Promise.all([
                        getCustomers(), 
                        getProducts(),
                        getUsers()
                    ]);
                    
                    // The backend uses isActive instead of status
                    const availableProducts = prodRes.data.filter(p => p.isActive !== false);
                    setProducts(availableProducts);
                    setCustomers(custRes.data);
                    
                    // Filter for just 'user' role for selecting as customer
                    const customerUsers = userRes.data.filter(u => u.role === 'user');
                    setUsers(customerUsers);
                    
                    if (isCustomer) {
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const customerProfile = custRes.data.find(c => c.user === user._id || c.name === user.name);
                        if (customerProfile) {
                            setSelectedCustomer(customerProfile._id);
                            if (customerProfile.addresses && customerProfile.addresses.length > 0) {
                                setCustomerAddress(`${customerProfile.addresses[0].street}, ${customerProfile.addresses[0].barangay}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching modal data:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, isCustomer]);

    if (!isOpen) return null;

    const addItem = () => {
        setOrderItems([...orderItems, { product: '', qty: 1, price: 0, payDeposit: false, depositAmount: 0 }]);
    };

    const removeItem = (index) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...orderItems];
        newItems[index][field] = value;
        
        if (field === 'product') {
            const prod = products.find(p => p._id === value);
            newItems[index].price = prod ? prod.pricePerUnit : 0;
            newItems[index].depositAmount = prod ? (prod.containerDeposit || 0) : 0;
        }
        
        setOrderItems(newItems);
    };

    const totalAmount = orderItems.reduce((sum, item) => {
        const deposit = item.payDeposit ? (item.depositAmount || 0) * item.qty : 0;
        return sum + (item.price * item.qty) + deposit;
    }, 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Find by either customer ID or user ID
        const customer = customers.find(c => c._id === selectedCustomer) || users.find(u => u._id === selectedCustomer);
        const finalAddress = isCustomer ? customerAddress : (customer?.addresses?.[0] ? `${customer.addresses[0].street}, ${customer.addresses[0].barangay}` : (customer?.address || 'No address saved'));
        
        onSave({
            customer: selectedCustomer,
            customerName: customer?.name || 'Walk-in Customer',
            items: orderItems.map(item => {
                const prod = products.find(p => p._id === item.product);
                return {
                    ...item,
                    productName: prod ? prod.name : 'Unknown Product',
                    payDeposit: item.payDeposit,
                    depositAmount: item.payDeposit ? item.depositAmount : 0
                };
            }),
            totalAmount,
            deliveryAddress: finalAddress
        });
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content" style={{
                background: 'var(--surface-bg)',
                padding: '2rem',
                borderRadius: '1.5rem',
                width: '90vw',
                maxWidth: '650px',
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={24} />
                </button>
                
                <h3 style={{ fontSize: '1.625rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
                    {isCustomer ? 'Request Water Delivery' : 'Create Delivery Order'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>Fill in the details below to dispatch a new delivery.</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    {!isCustomer && (
                        <div style={{ padding: '1.25rem', background: 'var(--page-bg)', borderRadius: '1rem', border: '1px solid var(--border-light)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1rem' }}>
                                <UserIcon size={18} color="#4F46E5" />
                                <span>Customer Selection</span>
                            </label>
                            <select 
                                required
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--surface-bg)', fontSize: '0.95rem', outline: 'none', appearance: 'none' }}
                            >
                                <option value="">-- Choose Customer or User --</option>
                                <optgroup label="Customer Profiles">
                                    {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
                                </optgroup>
                                <optgroup label="Registered Users">
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                                </optgroup>
                            </select>
                        </div>
                    )}

                    {isCustomer && (
                        <div style={{ padding: '1.25rem', background: 'var(--page-bg)', borderRadius: '1rem', border: '1px solid var(--border-light)' }}>
                             <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.875rem' }}>
                                <MapPin size={18} color="#4F46E5" />
                                <span>Delivery Address</span>
                             </label>
                             <input 
                                type="text"
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--surface-bg)', outline: 'none' }}
                                placeholder="Enter street, barangay, city"
                                required
                             />
                        </div>
                    )}

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                <ShoppingBag size={18} color="#4F46E5" />
                                <span>Order Items</span>
                            </label>
                            <button type="button" onClick={addItem} style={{ fontSize: '0.85rem', color: '#4F46E5', background: '#EEF2FF', padding: '0.5rem 0.875rem', borderRadius: '0.625rem', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <Plus size={16} /> Add Item
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {orderItems.map((item, index) => {
                                const selectedProd = products.find(p => p._id === item.product);
                                return (
                                    <div key={index} style={{ 
                                        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 80px auto auto', gap: '0.75rem', alignItems: 'start',
                                        padding: '1rem', background: 'var(--page-bg)', borderRadius: '1rem', border: '1px solid var(--border-light)'
                                    }}>
                                        <div style={{ display: 'flex', gap: '0.875rem' }}>
                                            <div style={{ width: '64px', height: '64px', borderRadius: '0.75rem', background: 'var(--surface-bg)', border: '1px solid var(--border-light)', overflow: 'hidden', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                                {selectedProd?.imageUrl ? (
                                                    <img src={selectedProd.imageUrl} alt={selectedProd.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <Package size={24} color="var(--text-light)" />
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <select 
                                                    required
                                                    value={item.product}
                                                    onChange={(e) => updateItem(index, 'product', e.target.value)}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--surface-bg)', fontSize: '0.9rem', outline: 'none', marginBottom: '0.375rem' }}
                                                >
                                                    <option value="">Select Product</option>
                                                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                                </select>
                                                {selectedProd && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                        ₱{selectedProd.pricePerUnit} / unit • {selectedProd.stockQty} in stock
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Qty</label>
                                            <input 
                                                type="number" 
                                                min="1"
                                                value={item.qty}
                                                onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value))}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--surface-bg)', textAlign: 'center', fontWeight: '700' }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Deposit</label>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '36px', width: '36px', background: item.payDeposit ? '#EEF2FF' : 'transparent', borderRadius: '0.5rem', border: '1px solid var(--border-light)', cursor: 'pointer' }} onClick={() => updateItem(index, 'payDeposit', !item.payDeposit)}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={item.payDeposit} 
                                                    onChange={() => {}} // Handled by div click
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </div>
                                        </div>

                                        <button type="button" onClick={() => removeItem(index)} style={{ alignSelf: 'center', color: '#EF4444', background: '#FEF2F2', padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem', background: '#F9FAFB', borderRadius: '1.25rem', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Order Summary</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '700' }}>{orderItems.length} items</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>Total Amount</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4F46E5' }}>₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '1rem', borderRadius: '0.875rem', background: 'transparent', color: 'var(--text-muted)', fontWeight: '700', border: '1px solid var(--border-light)', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" style={{ flex: 2, padding: '1rem', borderRadius: '0.875rem', background: '#4F46E5', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                            Confirm & Dispatch
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrderModal;
