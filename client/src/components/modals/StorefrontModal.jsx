import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Minus, Plus, MapPin, CheckCircle2 } from 'lucide-react';
import { getProducts, getCustomers } from '../../services';

const StorefrontModal = ({ isOpen, onClose, onSave, initialCart, onCartUpdate }) => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState(initialCart || []);
    const [step, setStep] = useState(1); // 1: Browse, 2: Cart Summary, 3: Checkout Details

    useEffect(() => {
        if (isOpen) {
            const savedStep = localStorage.getItem('checkout_step');
            if (savedStep) {
                setStep(parseInt(savedStep));
                localStorage.removeItem('checkout_step');
            } else if (cart.length > 0) {
                setStep(2);
            } else {
                setStep(1);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        if (initialCart && Array.isArray(initialCart)) {
            // Only update if actually different to avoid loops
            if (JSON.stringify(initialCart) !== JSON.stringify(cart)) {
                setCart(initialCart);
                
                // Also update selectedItems to match the new cart items
                const initialIds = initialCart.map(item => item.product._id);
                setSelectedItems(prev => {
                    const stillValid = prev.filter(id => initialIds.includes(id));
                    const newItems = initialIds.filter(id => !prev.includes(id));
                    return [...stillValid, ...newItems];
                });

                const savedStep = localStorage.getItem('checkout_step');
                if (savedStep === '2') {
                    setStep(2);
                    localStorage.removeItem('checkout_step');
                }
            }
        }
    }, [initialCart]);

    // Use a separate effect to notify parent, but only when internal cart changes
    useEffect(() => {
        if (onCartUpdate && JSON.stringify(cart) !== JSON.stringify(initialCart)) {
            onCartUpdate(cart);
        }
    }, [cart, onCartUpdate, initialCart]);

    const [address, setAddress] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const getItemKey = (item) => `${item.product._id}-${item.payDeposit ? 'deposit' : 'no'}`;

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [prodRes, custRes] = await Promise.all([getProducts(), getCustomers()]);
                    setProducts(prodRes.data.filter(p => p.isActive !== false));
                    
                    const customerProfile = custRes.data.find(c => c.user === user._id || c.name === user.name);
                    if (customerProfile) {
                        setCustomerId(customerProfile._id);
                        if (customerProfile.addresses?.length > 0) {
                            setAddress(`${customerProfile.addresses[0].street}, ${customerProfile.addresses[0].barangay}`);
                        }
                    }
                    setLoading(false);
                } catch (error) {
                    console.error('Error loading storefront data:', error);
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    const addToCart = (product, payDeposit = false) => {
        setCart(prev => {
            const existing = prev.find(item => item.product._id === product._id && item.payDeposit === payDeposit);
            if (existing) {
                return prev.map(item => (item.product._id === product._id && item.payDeposit === payDeposit) ? { ...item, qty: item.qty + 1 } : item);
            }
            const newItem = { product, qty: 1, payDeposit };
            const newCart = [...prev, newItem];
            setSelectedItems(current => [...current, getItemKey(newItem)]);
            return newCart;
        });
    };

    const [selectedItems, setSelectedItems] = useState([]);

    const updateQty = (productId, delta, payDeposit) => {
        setCart(prev => {
            const newCart = prev.map(item => {
                if (item.product._id === productId && item.payDeposit === payDeposit) {
                    const newQty = Math.max(0, item.qty + delta);
                    return { ...item, qty: newQty };
                }
                return item;
            }).filter(item => item.qty > 0);
            
            // Remove from selection if quantity becomes 0
            const newCartKeys = newCart.map(getItemKey);
            setSelectedItems(prevSelected => prevSelected.filter(key => newCartKeys.includes(key)));
            
            return newCart;
        });
    };

    const toggleSelection = (key) => {
        setSelectedItems(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const toggleAll = () => {
        if (selectedItems.length === cart.length && cart.length > 0) {
            setSelectedItems([]);
        } else {
            setSelectedItems(cart.map(getItemKey));
        }
    };

    const [localDeposit, setLocalDeposit] = useState({});

    const totalAmount = cart
        .filter(item => selectedItems.includes(getItemKey(item)))
        .reduce((sum, item) => {
            const deposit = item.payDeposit ? (item.product.containerDeposit || 0) * item.qty : 0;
            return sum + (item.product.pricePerUnit * item.qty) + deposit;
        }, 0);

    const handleCheckout = (e) => {
        e.preventDefault();
        const itemsToCheckout = cart.filter(item => selectedItems.includes(getItemKey(item)));
        onSave({
            customer: customerId,
            items: itemsToCheckout.map(item => ({
                product: item.product._id,
                productName: item.product.name,
                qty: item.qty,
                price: item.product.pricePerUnit,
                payDeposit: item.payDeposit,
                depositAmount: item.payDeposit ? (item.product.containerDeposit || 0) : 0
            })),
            totalAmount,
            deliveryAddress: address,
            status: 'pending'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)'
        }}>
            <div style={{
                background: 'var(--input-bg)', borderRadius: '1.5rem', width: '90%', maxWidth: '800px',
                height: '80vh', display: 'flex', flexDirection: 'column', position: 'relative',
                overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>
                            {step === 1 ? 'Water Store' : step === 2 ? 'Shopping Cart' : 'Checkout Delivery'}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {step === 1 ? 'Browse our products' : step === 2 ? 'Manage your selected items' : 'Confirm your delivery details'}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ color: 'var(--text-light)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="modal-content" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                    {step === 1 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                            {products.map(product => {
                                const isDeposit = localDeposit[product._id] || false;
                                const cartItem = cart.find(item => item.product._id === product._id && item.payDeposit === isDeposit);
                                return (
                                    <div key={product._id} className="storefront-product-card">
                                        <div style={{ padding: '2rem', background: 'var(--surface-hover)', borderRadius: '0.75rem', display: 'grid', placeItems: 'center' }}>
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.5rem' }} />
                                            ) : (
                                                <Package size={40} color="#4F46E5" style={{ opacity: 0.2 }} />
                                            )}
                                        </div>
                                        <div style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                                <h4 style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>{product.name}</h4>
                                                <span style={{ 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: '800', 
                                                    color: product.stockQty > 0 ? '#10B981' : '#EF4444',
                                                    background: product.stockQty > 0 ? 'var(--badge-green-bg)' : 'var(--badge-red-bg)',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '0.5rem',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {product.stockQty > 0 ? `${product.stockQty} Stock` : 'Out'}
                                                </span>
                                            </div>
                                            <p style={{ color: '#4F46E5', fontWeight: '800', fontSize: '1.25rem', marginBottom: '0.75rem' }}>₱{product.pricePerUnit}</p>

                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isDeposit} 
                                                        onChange={(e) => setLocalDeposit({...localDeposit, [product._id]: e.target.checked})}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    Buy New (+₱{product.containerDeposit || 0} Deposit)
                                                </label>
                                            </div>
                                            
                                            {cartItem ? (
                                                <div style={{ 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                                    background: 'var(--badge-blue-bg)', borderRadius: '0.75rem', padding: '0.5rem' 
                                                }}>
                                                    <button 
                                                        onClick={() => updateQty(product._id, -1, isDeposit)}
                                                        style={{ background: 'var(--input-bg)', border: '1px solid #C7D2FE', borderRadius: '0.5rem', padding: '0.25rem', cursor: 'pointer', color: '#4F46E5', display: 'grid', placeItems: 'center' }}
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <span style={{ fontWeight: '800', color: '#4F46E5', fontSize: '1.1rem' }}>{cartItem.qty}</span>
                                                    <button 
                                                        onClick={() => updateQty(product._id, 1, isDeposit)}
                                                        disabled={cartItem.qty >= product.stockQty}
                                                        style={{ 
                                                            background: 'var(--input-bg)', border: '1px solid #C7D2FE', borderRadius: '0.5rem', padding: '0.25rem', 
                                                            cursor: cartItem.qty >= product.stockQty ? 'not-allowed' : 'pointer', 
                                                            color: '#4F46E5', display: 'grid', placeItems: 'center',
                                                            opacity: cartItem.qty >= product.stockQty ? 0.5 : 1
                                                        }}
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => addToCart(product, isDeposit)}
                                                    disabled={product.stockQty <= 0}
                                                    style={{ 
                                                        width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: 'none',
                                                        background: product.stockQty > 0 ? '#4F46E5' : 'var(--surface-hover)', 
                                                        color: product.stockQty > 0 ? 'white' : '#9CA3AF', 
                                                        fontWeight: '700', cursor: product.stockQty > 0 ? 'pointer' : 'not-allowed',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                                    }}
                                                >
                                                    <Plus size={18} /> Add to Order
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : step === 2 ? (
                        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h4 style={{ fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                    <ShoppingCart size={20} /> My Cart ({cart.length})
                                </h4>
                                {cart.length > 0 && (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#4F46E5', fontWeight: '600' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedItems.length === cart.length && cart.length > 0} 
                                            onChange={toggleAll}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        Select All
                                    </label>
                                )}
                            </div>
                            {cart.map(item => {
                                const key = getItemKey(item);
                                const isSelected = selectedItems.includes(key);
                                return (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-light)', opacity: isSelected ? 1 : 0.6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected} 
                                                onChange={() => toggleSelection(key)}
                                                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                            />
                                            <div style={{ width: '50px', height: '50px', background: 'var(--input-bg)', borderRadius: '0.5rem', border: '1px solid var(--border-light)', display: 'grid', placeItems: 'center' }}>
                                                {item.product.imageUrl ? (
                                                    <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.5rem' }} />
                                                ) : (
                                                    <Package size={20} color="#4F46E5" />
                                                )}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '700', color: 'var(--text-muted)', margin: 0 }}>
                                                    {item.product.name}
                                                    {item.payDeposit && <span style={{ fontSize: '0.65rem', color: '#4F46E5', fontWeight: '800', marginLeft: '0.5rem', background: 'var(--badge-blue-bg)', padding: '0.1rem 0.3rem', borderRadius: '0.3rem' }}>+ DEPOSIT</span>}
                                                </p>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>₱{item.product.pricePerUnit} / unit</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--border-medium)', borderRadius: '0.5rem', padding: '0.25rem' }}>
                                                <button onClick={() => updateQty(item.product._id, -1, item.payDeposit)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5' }}><Minus size={16} /></button>
                                                <span style={{ fontWeight: '700', minWidth: '24px', textAlign: 'center' }}>{item.qty}</span>
                                                <button onClick={() => updateQty(item.product._id, 1, item.payDeposit)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5' }}><Plus size={16} /></button>
                                            </div>
                                            <span style={{ fontWeight: '700', color: 'var(--text-main)', textAlign: 'right', minWidth: '80px' }}>₱{((item.product.pricePerUnit * item.qty) + (item.payDeposit ? (item.product.containerDeposit || 0) * item.qty : 0)).toFixed(2)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px dashed var(--border-medium)' }}>
                                    <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>Total Amount</span>
                                    <span style={{ fontWeight: '800', fontSize: '1.4rem', color: '#4F46E5' }}>₱{totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                    ) : (
                        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ background: '#F0FDF4', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #BBF7D0' }}>
                                <h4 style={{ fontWeight: '700', marginBottom: '1rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle2 size={18} /> Review Order details
                                </h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Selected Products</span>
                                    <span style={{ fontWeight: '700' }}>{selectedItems.length} items</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                                    <span>Total Amount</span>
                                    <span>₱{totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                                {selectedItems.length > 0 && (
                                    <div style={{ background: 'var(--page-bg)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid var(--border-light)' }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Items to be ordered:</p>
                                        {cart.filter(i => selectedItems.includes(getItemKey(i))).map(item => {
                                            const itemSubtotal = item.product.pricePerUnit * item.qty;
                                            const itemDeposit = item.payDeposit ? (item.product.containerDeposit || 0) * item.qty : 0;
                                            return (
                                                <div key={getItemKey(item)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.25rem 0' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>
                                                        {item.product.name} x {item.qty}
                                                        <span style={{ fontSize: '0.7rem', color: '#4F46E5', fontWeight: '700' }}> ({item.payDeposit ? 'Deposit' : 'No Deposit'})</span>
                                                    </span>
                                                    <span style={{ fontWeight: '600' }}>₱{(itemSubtotal + itemDeposit).toFixed(2)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label style={{ fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={18} /> Delivery Address
                                </label>
                                <textarea 
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                    placeholder="Enter your complete delivery address..."
                                    style={{ 
                                        width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-medium)',
                                        minHeight: '120px', resize: 'vertical', fontSize: '0.95rem', outline: 'none'
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--page-bg)' }}>
                    {step === 1 ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <ShoppingCart size={24} color="var(--text-muted)" />
                                    {cart.length > 0 && (
                                        <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#EF4444', color: 'white', fontSize: '0.7rem', fontWeight: '700', width: '18px', height: '18px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                                            {cart.length}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <p style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>₱{totalAmount.toFixed(2)}</p>
                                </div>
                            </div>
                            <button 
                                disabled={cart.length === 0}
                                onClick={() => setStep(2)}
                                style={{ 
                                    padding: '0.875rem 2rem', borderRadius: '0.75rem', border: 'none',
                                    background: cart.length === 0 ? 'var(--border-medium)' : '#4F46E5', color: 'white', 
                                    fontWeight: '700', cursor: cart.length === 0 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Checkout
                            </button>
                        </>
                    ) : step === 2 ? (
                        <>
                            <button 
                                onClick={() => setStep(1)}
                                style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: '700', cursor: 'pointer' }}
                            >
                                ← Back to Store
                            </button>
                            <button 
                                onClick={() => setStep(3)}
                                disabled={selectedItems.length === 0}
                                style={{ 
                                    padding: '0.875rem 2rem', borderRadius: '0.75rem', border: 'none',
                                    background: selectedItems.length === 0 ? 'var(--border-medium)' : '#4F46E5', 
                                    color: 'white', fontWeight: '700', cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Continue to Checkout
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={() => setStep(2)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer' }}
                            >
                                ← Back to Cart
                            </button>
                            <button 
                                onClick={handleCheckout}
                                disabled={!address.trim() || selectedItems.length === 0}
                                style={{ 
                                    padding: '0.875rem 2.5rem', borderRadius: '0.75rem', border: 'none',
                                    background: (!address.trim() || selectedItems.length === 0) ? 'var(--border-medium)' : '#10B981', 
                                    color: 'white', fontWeight: '700', cursor: (!address.trim() || selectedItems.length === 0) ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                }}
                            >
                                <CheckCircle2 size={20} /> Place Order
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StorefrontModal;