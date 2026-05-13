import React, { useState } from 'react';
import { X, Minus, Plus, ShoppingCart, CheckCircle2 } from 'lucide-react';

const ProductSelectionModal = ({ isOpen, onClose, product, onAddToCart, onBuyNow, mode }) => {
    const [qty, setQty] = useState(1);
    const [payDeposit, setPayDeposit] = useState(false);

    if (!isOpen || !product) return null;

    const subtotal = product.pricePerUnit * qty;
    const depositAmount = payDeposit ? (product.containerDeposit || 0) * qty : 0;
    const total = (subtotal + depositAmount).toFixed(2);

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content" style={{
                background: 'var(--input-bg)', borderRadius: '1.25rem', width: '90%', maxWidth: '400px',
                padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
                        {mode === 'buy' ? 'Immediate Checkout' : 'Add to Cart'}
                    </h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ width: '80px', height: '80px', background: 'var(--surface-hover)', borderRadius: '1rem', margin: '0 auto 1rem', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                        {product.imageUrl ? <img src={product.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <ShoppingCart size={32} color="#4F46E5" />}
                    </div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{product.name}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>₱{product.pricePerUnit} per unit</p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Select Quantity</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', background: 'var(--page-bg)', padding: '0.75rem', borderRadius: '1rem', border: '1px solid var(--border-light)' }}>
                        <button 
                            onClick={() => setQty(Math.max(1, qty - 1))}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                        >
                            <Minus size={16} />
                        </button>
                        <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', minWidth: '40px', textAlign: 'center' }}>{qty}</span>
                        <button 
                            onClick={() => setQty(Math.min(product.stockQty, qty + 1))}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-medium)', background: 'var(--input-bg)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                {product.containerDeposit > 0 && (
                    <div style={{ 
                        marginBottom: '1.5rem', padding: '1rem', background: payDeposit ? '#EEF2FF' : '#F9FAFB', 
                        borderRadius: '1rem', border: payDeposit ? '1px solid #4F46E5' : '1px solid var(--border-light)',
                        transition: 'all 0.2s'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setPayDeposit(!payDeposit)}>
                            <div style={{ 
                                width: '20px', height: '20px', borderRadius: '4px', border: '2px solid #4F46E5',
                                background: payDeposit ? '#4F46E5' : 'transparent', display: 'grid', placeItems: 'center'
                            }}>
                                {payDeposit && <CheckCircle2 size={14} color="white" />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Pay Container Deposit</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Select if you don't have a gallon to swap</p>
                            </div>
                            <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#4F46E5', margin: 0 }}>+₱{product.containerDeposit * qty}</p>
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: '1.5rem', textAlign: 'center', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-light)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Total</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: '900', color: '#4F46E5', margin: 0 }}>₱{total}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(mode === 'cart' || !mode) && (
                        <button 
                            onClick={() => onAddToCart(product, qty, payDeposit)}
                            disabled={product.stockQty <= 0}
                            style={{ 
                                width: '100%', padding: '1rem', borderRadius: '0.75rem', 
                                border: product.stockQty > 0 ? '1px solid #4F46E5' : '1px solid var(--border-light)', 
                                background: 'var(--surface-bg)', color: product.stockQty > 0 ? '#4F46E5' : '#9CA3AF', 
                                fontWeight: '700', cursor: product.stockQty > 0 ? 'pointer' : 'not-allowed' 
                            }}
                        >
                            Confirm Add to Cart
                        </button>
                    )}
                    {(mode === 'buy' || !mode) && (
                        <button 
                            onClick={() => onBuyNow(product, qty, payDeposit)}
                            disabled={product.stockQty <= 0}
                            style={{ 
                                width: '100%', padding: '1rem', borderRadius: '0.75rem', border: 'none', 
                                background: product.stockQty > 0 ? '#4F46E5' : 'var(--surface-hover)', 
                                color: product.stockQty > 0 ? 'white' : '#9CA3AF', 
                                fontWeight: '700', cursor: product.stockQty > 0 ? 'pointer' : 'not-allowed' 
                            }}
                        >
                            Proceed to Checkout
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductSelectionModal;