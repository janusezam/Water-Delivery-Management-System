import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import Toast from '../../components/common/Toast';
import { ShoppingBag, Plus, Minus, Trash2, CreditCard, Search, Droplets, DollarSign } from 'lucide-react';
import { getProducts, getCustomers, createWalkIn, getWalkIns } from '../../services';

const WalkInPage = () => {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [recentSales, setRecentSales] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [jugsReturned, setJugsReturned] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountTendered, setAmountTendered] = useState('');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchData = async () => {
        try {
            const [prodRes, custRes, salesRes] = await Promise.all([getProducts(), getCustomers(), getWalkIns()]);
            setProducts(prodRes.data);
            setCustomers(custRes.data);
            setRecentSales(salesRes.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data', error);
            showToast('Failed to load data', 'error');
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Unique key per product+deposit combo
    const getCartKey = (productId, payDeposit) => `${productId}-${payDeposit ? 'dep' : 'no'}`;

    const addToCart = (product) => {
        const key = getCartKey(product._id, false);
        const exists = cart.find(item => item.cartKey === key);
        if (exists) {
            setCart(cart.map(item => item.cartKey === key ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, { ...product, qty: 1, payDeposit: false, cartKey: key }]);
        }
    };

    const removeFromCart = (cartKey) => setCart(cart.filter(item => item.cartKey !== cartKey));

    const toggleDeposit = (cartKey) => {
        setCart(cart.map(item => {
            if (item.cartKey !== cartKey) return item;
            const newPayDeposit = !item.payDeposit;
            return { ...item, payDeposit: newPayDeposit, cartKey: getCartKey(item._id, newPayDeposit) };
        }));
    };

    const updateQty = (cartKey, delta) => {
        setCart(cart.map(item => {
            if (item.cartKey !== cartKey) return item;
            return { ...item, qty: Math.max(1, item.qty + delta) };
        }));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.pricePerUnit * item.qty), 0);
    const deposits = cart.reduce((sum, item) => sum + (item.payDeposit ? (item.containerDeposit || 0) * item.qty : 0), 0);
    const total = subtotal + deposits;
    const change = amountTendered ? parseFloat(amountTendered) - total : 0;

    const handleCheckout = async () => {
        if (cart.length === 0) return showToast('Cart is empty', 'error');
        if (!amountTendered || parseFloat(amountTendered) < total) return showToast('Insufficient amount tendered', 'error');
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            await createWalkIn({
                servedBy: user._id || user.id,
                customer: selectedCustomer?._id,
                customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
                items: cart.map(item => ({ product: item._id, qty: item.qty, price: item.pricePerUnit, payDeposit: item.payDeposit, depositAmount: item.payDeposit ? (item.containerDeposit || 0) : 0 })),
                jugsReturned,
                totalAmount: total,
                paymentMethod,
                amountTendered: parseFloat(amountTendered),
                change
            });
            showToast('Sale Successful!');
            setCart([]);
            setSelectedCustomer(null);
            setAmountTendered('');
            setJugsReturned(0);
            fetchData();
        } catch (error) {
            const errorData = error.response?.data;
            showToast(errorData?.error || errorData?.message || 'Checkout failed', 'error');
        }
    };

    const todayTotal = recentSales
        .filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString())
        .reduce((sum, s) => sum + s.totalAmount, 0);

    return (
        <div className="dashboard-container" style={{ background: 'var(--page-bg)', display: 'flex', minHeight: '100vh' }}>
            <Sidebar role="staff" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['Walk-In Sales']} />

                <main style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>

                    {/* ── Left: Scrollable Content ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Summary Cards */}
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <div style={{ flex: 1, padding: '1.25rem', background: 'var(--surface-bg)', borderRadius: '1rem', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ padding: '0.75rem', background: 'var(--badge-blue-bg)', borderRadius: '0.75rem' }}>
                                    <DollarSign size={22} color="#4F46E5" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Today's Revenue</p>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>₱{todayTotal.toFixed(2)}</h3>
                                </div>
                            </div>
                            <div style={{ flex: 1, padding: '1.25rem', background: 'var(--surface-bg)', borderRadius: '1rem', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ padding: '0.75rem', background: 'var(--badge-green-bg)', borderRadius: '0.75rem' }}>
                                    <ShoppingBag size={22} color="#10B981" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Total Sales Today</p>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>{recentSales.length}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>Available Products</h3>
                                <div style={{ position: 'relative' }}>
                                    <Search style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--text-light)' }} size={16} />
                                    <input type="text" placeholder="Search..." style={{ padding: '0.5rem 1rem 0.5rem 2.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.85rem', width: '200px' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                                {products.map(product => (
                                    <div key={product._id} onClick={() => addToCart(product)}
                                        style={{ background: 'var(--page-bg)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border-light)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                                        <div style={{ width: '52px', height: '52px', background: 'var(--badge-blue-bg)', borderRadius: '0.875rem', display: 'grid', placeItems: 'center', margin: '0 auto 0.75rem', overflow: 'hidden' }}>
                                            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Droplets size={22} color="#4F46E5" />}
                                        </div>
                                        <h4 style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{product.name}</h4>
                                        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: product.stockQty < 10 ? '#EF4444' : '#10B981', marginBottom: '0.25rem' }}>{product.stockQty} IN STOCK</div>
                                        <p style={{ fontSize: '1rem', fontWeight: '800', color: '#4F46E5' }}>₱{product.pricePerUnit}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--surface-hover)' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>Recent Transactions</h3>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--page-bg)', borderBottom: '1px solid var(--border-light)' }}>
                                    <tr>
                                        <th style={{ padding: '0.875rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>RECEIPT</th>
                                        <th style={{ padding: '0.875rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>CUSTOMER</th>
                                        <th style={{ padding: '0.875rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>AMOUNT</th>
                                        <th style={{ padding: '0.875rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>TIME</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentSales.slice(0, 5).map(sale => (
                                        <tr key={sale._id} style={{ borderBottom: '1px solid var(--surface-hover)' }}>
                                            <td style={{ padding: '1rem 1.5rem', fontWeight: '700', fontSize: '0.85rem', color: '#4F46E5' }}>{sale.receiptNo}</td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>{sale.customerName}</td>
                                            <td style={{ padding: '1rem 1.5rem', fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-main)', textAlign: 'right' }}>₱{sale.totalAmount.toFixed(2)}</td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Right: Sticky Checkout Card ── */}
                    <div style={{
                        position: 'sticky',
                        top: '2rem',
                        background: 'var(--surface-bg)',
                        borderRadius: '1.5rem',
                        border: '1px solid var(--border-light)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: 'calc(100vh - 5rem)'
                    }}>
                        {/* Card Header */}
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--surface-hover)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <ShoppingBag size={18} color="#4F46E5" /> Current Order
                            </h3>
                            <label style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Select Customer</label>
                            <select onChange={(e) => setSelectedCustomer(customers.find(c => c._id === e.target.value))}
                                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', background: 'var(--page-bg)', fontWeight: '600', fontSize: '0.875rem' }}>
                                <option value="">Walk-in (Guest)</option>
                                {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>

                        {/* Cart Items — scrollable */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
                            {cart.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--border-medium)' }}>
                                    <ShoppingBag size={36} style={{ margin: '0 auto 0.5rem' }} />
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Cart is empty</p>
                                </div>
                            ) : cart.map(item => (
                                <div key={item.cartKey} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--surface-hover)' }}>
                                    {/* Item name + price row */}
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <h5 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)' }}>{item.name}</h5>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₱{item.pricePerUnit} each{item.payDeposit ? ` + ₱${item.containerDeposit} deposit` : ''}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'var(--surface-hover)', padding: '0.2rem 0.5rem', borderRadius: '0.5rem' }}>
                                            <button onClick={() => updateQty(item.cartKey, -1)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#4F46E5', display: 'flex' }}><Minus size={13} /></button>
                                            <span style={{ fontSize: '0.875rem', fontWeight: '800', minWidth: '18px', textAlign: 'center', color: 'var(--text-main)' }}>{item.qty}</span>
                                            <button onClick={() => updateQty(item.cartKey, 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#4F46E5', display: 'flex' }}><Plus size={13} /></button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.cartKey)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex' }}><Trash2 size={15} /></button>
                                    </div>
                                    {/* Deposit checkbox */}
                                    {(item.containerDeposit > 0) && (
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none' }}>
                                            <input
                                                type="checkbox"
                                                checked={item.payDeposit}
                                                onChange={() => toggleDeposit(item.cartKey)}
                                                style={{ width: '14px', height: '14px', accentColor: '#4F46E5', cursor: 'pointer' }}
                                            />
                                            <span style={{ fontSize: '0.72rem', fontWeight: '600', color: item.payDeposit ? '#4F46E5' : '#9CA3AF' }}>
                                                Pay Deposit (+₱{item.containerDeposit})
                                            </span>
                                        </label>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Totals + Payment Footer */}
                        <div style={{ borderTop: '1px solid var(--surface-hover)', padding: '1.25rem 1.5rem', background: 'var(--page-bg)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <span>Jug Deposits</span><span>₱{deposits.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '900', color: 'var(--text-main)', paddingTop: '0.625rem', borderTop: '2px dashed var(--border-light)', marginTop: '0.25rem' }}>
                                    <span>Total</span><span style={{ color: '#4F46E5' }}>₱{total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>TENDERED</label>
                                    <input type="number" placeholder="0.00" value={amountTendered} onChange={(e) => setAmountTendered(e.target.value)}
                                        style={{ width: '100%', padding: '0.625rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ minWidth: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-light)' }}>CHANGE</span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#10B981' }}>₱{change >= 0 ? change.toFixed(2) : '0.00'}</span>
                                </div>
                            </div>

                            {/* Jugs Returned — only show for registered customers */}
                            {selectedCustomer && (
                                <div style={{ marginBottom: '1rem', padding: '0.875rem', background: 'var(--surface-bg)', borderRadius: '0.75rem', border: '1px solid var(--border-light)' }}>
                                    <label style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                                        Empty Jugs Returned by Customer
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setJugsReturned(prev => Math.max(0, prev - 1))}
                                            style={{ width: '36px', height: '36px', borderRadius: '0.5rem', border: '1px solid var(--border-medium)', background: 'var(--page-bg)', cursor: 'pointer', fontSize: '1.1rem', fontWeight: '700', color: '#4F46E5', display: 'grid', placeItems: 'center' }}
                                        >−</button>
                                        <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--text-main)', minWidth: '40px', textAlign: 'center' }}>
                                            {jugsReturned}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setJugsReturned(prev => prev + 1)}
                                            style={{ width: '36px', height: '36px', borderRadius: '0.5rem', border: '1px solid var(--border-medium)', background: 'var(--page-bg)', cursor: 'pointer', fontSize: '1.1rem', fontWeight: '700', color: '#4F46E5', display: 'grid', placeItems: 'center' }}
                                        >+</button>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontStyle: 'italic', marginLeft: '0.25rem' }}>
                                            {selectedCustomer.jugBalance > 0 ? `(Owes ${selectedCustomer.jugBalance} jugs)` : '(Balance clear)'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <button onClick={handleCheckout} disabled={cart.length === 0}
                                style={{ width: '100%', padding: '0.875rem', background: cart.length === 0 ? 'var(--border-medium)' : '#4F46E5', color: 'white', border: 'none', borderRadius: '1rem', fontWeight: '800', fontSize: '0.95rem', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', boxShadow: cart.length === 0 ? 'none' : '0 4px 14px rgba(79,70,229,0.35)', transition: 'all 0.2s' }}>
                                <CreditCard size={18} /> Pay & Print Receipt
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />
        </div>
    );
};

export default WalkInPage;
