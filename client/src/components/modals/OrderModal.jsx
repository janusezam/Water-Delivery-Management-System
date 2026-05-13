import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { getCustomers, getProducts } from '../../services';

const OrderModal = ({ isOpen, onClose, onSave, isCustomer = false }) => {
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [orderItems, setOrderItems] = useState([{ product: '', qty: 1, price: 0, payDeposit: false, depositAmount: 0 }]);
    const [customerAddress, setCustomerAddress] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                const [custRes, prodRes] = await Promise.all([getCustomers(), getProducts()]);
                const availableProducts = prodRes.data.filter(p => p.status === 'Available');
                setProducts(availableProducts);
                
                if (isCustomer) {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    // Find customer profile linked to this user
                    const customerProfile = custRes.data.find(c => c.user === user._id || c.name === user.name);
                    if (customerProfile) {
                        setSelectedCustomer(customerProfile._id);
                        if (customerProfile.addresses && customerProfile.addresses.length > 0) {
                            setCustomerAddress(`${customerProfile.addresses[0].street}, ${customerProfile.addresses[0].barangay}`);
                        }
                    }
                } else {
                    setCustomers(custRes.data);
                }
                setLoading(false);
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
        
        const prod = products.find(p => p._id === (field === 'product' ? value : newItems[index].product));
        
        if (field === 'product') {
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
        const customer = customers.find(c => c._id === selectedCustomer);
        const finalAddress = isCustomer ? customerAddress : (customer ? `${customer.addresses[0].street}, ${customer.addresses[0].barangay}` : '');
        
        onSave({
            customer: selectedCustomer,
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
                background: 'var(--modal-bg)',
                padding: '2rem',
                borderRadius: '1.5rem',
                width: '500px',
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={24} />
                </button>
                
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-main)' }}>{isCustomer ? 'Request Water Delivery' : 'Create Delivery Order'}</h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {!isCustomer ? (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Select Customer</label>
                            <select 
                                required
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                            >
                                <option value="">-- Choose Customer --</option>
                                {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
                            </select>
                        </div>
                    ) : (
                        <div>
                             <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Delivery Address</label>
                             <input 
                                type="text"
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                                placeholder="Edit delivery address if needed"
                                required
                             />
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>Items</label>
                        <button type="button" onClick={addItem} style={{ fontSize: '0.75rem', color: 'var(--accent-indigo)', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Plus size={14} /> Add Item
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {orderItems.map((item, index) => (
                            <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <select 
                                    required
                                    value={item.product}
                                    onChange={(e) => updateItem(index, 'product', e.target.value)}
                                    style={{ flex: 1, padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                                >
                                    <option value="">Select Product</option>
                                    {products.map(p => <option key={p._id} value={p._id}>{p.name} - ₱{p.pricePerUnit}</option>)}
                                </select>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={item.qty}
                                    onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value))}
                                    style={{ width: '60px', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem', background: 'var(--page-bg)', borderRadius: '0.5rem', border: '1px solid var(--border-light)' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={item.payDeposit} 
                                        onChange={(e) => updateItem(index, 'payDeposit', e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)' }}>Deposit</span>
                                </div>
                                <button type="button" onClick={() => removeItem(index)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '2px dashed var(--surface-hover)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Total Amount</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-indigo)' }}>₱{totalAmount.toFixed(2)}</span>
                    </div>

                    <button type="submit" className="btn-primary" style={{ padding: '1rem', borderRadius: '0.75rem', background: 'var(--accent-indigo)', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
                        Confirm Order
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OrderModal;
