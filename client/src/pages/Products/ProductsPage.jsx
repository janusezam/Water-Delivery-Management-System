import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, MoreVertical, Edit2, Trash2, ShoppingCart, Droplets, CheckCircle2 } from 'lucide-react';
import { getProducts, deleteProduct, createProduct, updateProduct, createOrder } from '../../services';
import ProductModal from '../../components/modals/ProductModal';
import ProductSelectionModal from '../../components/modals/ProductSelectionModal';
import { toast } from 'react-hot-toast';

const ProductsPage = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isCustomer = user.role === 'user';
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [selectionMode, setSelectionMode] = useState(null); // 'cart' or 'buy'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('user_cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('user_cart', JSON.stringify(cart));
    }, [cart]);

    const handleAddToCart = (product, qty, payDeposit) => {
        setCart(prev => {
            const existing = prev.find(item => item.product._id === product._id && item.payDeposit === payDeposit);
            if (existing) {
                return prev.map(item => (item.product._id === product._id && item.payDeposit === payDeposit) ? { ...item, qty: item.qty + qty } : item);
            }
            return [...prev, { product, qty, payDeposit }];
        });
        setIsSelectionModalOpen(false);
        toast.success(`${qty}x ${product.name} added to cart!`);
    };

    const handleBuyNow = (product, qty, payDeposit) => {
        setIsSelectionModalOpen(false);
        // Navigate to cart with the item in state, don't overwrite global cart
        navigate('/cart', { state: { buyNowItem: { product, qty, payDeposit } } });
    };

    const openSelection = (product, mode) => {
        setSelectedProduct(product);
        setSelectionMode(mode);
        setIsSelectionModalOpen(true);
    };

    const fetchProducts = async () => {
        try {
            const { data } = await getProducts();
            // If customer, only show active products
            const filtered = isCustomer ? data.filter(p => p.isActive !== false) : data;
            setProducts(filtered);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching products', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleCreateOrder = async (orderData) => {
        try {
            // Prepare data for the backend based on Order model
            const payload = {
                customerName: user.name,
                address: orderData.deliveryAddress,
                items: orderData.items.map(item => {
                    const prod = products.find(p => p._id === item.product);
                    return { productName: prod?.name || 'Water', qty: item.qty };
                }),
                coordinates: orderData.coordinates || { lat: 0, lng: 0 }
            };
            
            await createOrder(payload);
            setCart([]); // Clear cart on success
            localStorage.removeItem('user_cart');
            setIsStorefrontOpen(false);
            alert('Order placed successfully! Waiting for admin approval.');
        } catch (error) {
            console.error('Frontend Order Error:', error);
            alert('Failed to place order');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id);
                fetchProducts();
                toast.success('Product deleted successfully');
            } catch (error) {
                toast.error('Failed to delete product');
            }
        }
    };

    const handleSaveProduct = async (formData, imageFile) => {
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('type', formData.type);
            data.append('pricePerUnit', formData.pricePerUnit);
            data.append('stockQty', formData.stockQty);
            data.append('containerDeposit', formData.containerDeposit);
            if (imageFile) {
                data.append('image', imageFile);
            }

            if (editingProduct) {
                await updateProduct(editingProduct._id, data);
            } else {
                await createProduct(data);
            }
            setIsModalOpen(false);
            setEditingProduct(null);
            fetchProducts();
            toast.success(editingProduct ? 'Product updated' : 'Product created');
        } catch (error) {
            toast.error('Failed to save product');
        }
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <Sidebar role={user.role} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['Products']} />

                <main style={{ padding: '2rem 3rem' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
                                {isCustomer ? 'Our Products' : 'Inventory Management'}
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
                                {isCustomer ? 'High-quality water delivered right to your door.' : 'Manage your water products and stock levels.'}
                            </p>
                        </div>
                        {!isCustomer && (
                            <button 
                                onClick={openAddModal}
                                className="btn-primary" 
                                style={{ background: '#4F46E5', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontWeight: '600', color: 'white', border: 'none', cursor: 'pointer' }}
                            >
                                <Plus size={20} />
                                <span>Add Product</span>
                            </button>
                        )}
                    </header>

                    {isCustomer ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                            {products.map(product => (
                                <div key={product._id} className="product-card-hover" style={{ 
                                    background: 'var(--surface-bg)', border: '1px solid var(--border-light)', borderRadius: '1.5rem', 
                                    overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                    display: 'flex', flexDirection: 'column', height: '100%'
                                }}>
                                    {/* Image Showcase */}
                                    <div style={{ 
                                        height: '240px', 
                                        background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        position: 'relative',
                                        padding: '1rem',
                                        overflow: 'hidden'
                                    }}>
                                        {product.imageUrl ? (
                                            <img 
                                                src={product.imageUrl} 
                                                alt={product.name} 
                                                style={{ 
                                                    maxWidth: '100%', 
                                                    maxHeight: '100%', 
                                                    objectFit: 'contain', 
                                                    transition: 'transform 0.4s ease' 
                                                }} 
                                                className="product-image" 
                                            />
                                        ) : (
                                            <Droplets size={64} color="#4F46E5" style={{ opacity: 0.15 }} />
                                        )}
                                    </div>
                                    
                                    {/* Details */}
                                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface-bg)' }}>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>{product.name}</h3>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--surface-hover)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem' }}>{product.type}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: product.stockQty > 0 ? '#10B981' : '#EF4444' }}></div>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: product.stockQty > 0 ? '#10B981' : '#EF4444' }}>
                                                        {product.stockQty > 0 ? `${product.stockQty} Units Available` : 'Out of Stock'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div style={{ marginTop: 'auto' }}>
                                                <p style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.1rem', letterSpacing: '0.05em' }}>Price</p>
                                                <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4F46E5', margin: 0 }}>₱{product.pricePerUnit}</p>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                                <button 
                                                    onClick={() => openSelection(product, 'cart')}
                                                    disabled={product.stockQty <= 0}
                                                    style={{ 
                                                        flex: 1, padding: '0.75rem', borderRadius: '1rem', border: '1px solid var(--border-light)', 
                                                        background: 'var(--surface-bg)', color: product.stockQty > 0 ? '#4F46E5' : '#9CA3AF', 
                                                        fontWeight: '700', fontSize: '0.85rem', cursor: product.stockQty > 0 ? 'pointer' : 'not-allowed',
                                                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                                                    }}
                                                >
                                                    <ShoppingCart size={16} />
                                                    <span>Cart</span>
                                                </button>
                                                <button 
                                                    onClick={() => openSelection(product, 'buy')}
                                                    disabled={product.stockQty <= 0}
                                                    style={{ 
                                                        flex: 1, padding: '0.75rem', borderRadius: '1rem', border: 'none', 
                                                        background: product.stockQty > 0 ? '#4F46E5' : 'var(--surface-hover)', 
                                                        color: product.stockQty > 0 ? 'white' : '#9CA3AF', 
                                                        fontWeight: '700', fontSize: '0.85rem', cursor: product.stockQty > 0 ? 'pointer' : 'not-allowed',
                                                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                                        boxShadow: product.stockQty > 0 ? '0 4px 6px -1px rgba(79, 70, 229, 0.2)' : 'none'
                                                    }}
                                                >
                                                    <Plus size={16} />
                                                    <span>Buy</span>
                                                </button>
                                            </div>
                                        </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass" style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ position: 'relative', width: '320px' }}>
                                    <Search style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-light)' }} size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Search products..." 
                                        style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.9rem' }}
                                    />
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'var(--page-bg)', borderBottom: '1px solid var(--surface-hover)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Product Name</th>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Price</th>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stock</th>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deposit</th>
                                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.length > 0 ? products.map((product) => (
                                        <tr key={product._id} style={{ borderBottom: '1px solid var(--surface-hover)', transition: 'background 0.2s' }} className="table-row-hover">
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ 
                                                        width: '40px', 
                                                        height: '40px', 
                                                        background: 'var(--badge-blue-bg)', 
                                                        borderRadius: '0.75rem',
                                                        overflow: 'hidden',
                                                        display: 'grid',
                                                        placeItems: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        {product.imageUrl ? (
                                                            <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <Package size={20} color="#4F46E5" />
                                                        )}
                                                    </div>
                                                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{product.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>{product.type}</td>
                                            <td style={{ padding: '1rem 1.5rem', fontWeight: '600', color: 'var(--text-main)' }}>₱{product.pricePerUnit.toFixed(2)}</td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ 
                                                    padding: '0.25rem 0.75rem', 
                                                    borderRadius: '1rem', 
                                                    fontSize: '0.75rem', 
                                                    fontWeight: '700',
                                                    background: product.stockQty < 10 ? 'var(--badge-red-bg)' : 'var(--badge-green-bg)',
                                                    color: product.stockQty < 10 ? '#EF4444' : '#10B981'
                                                }}>
                                                    {product.stockQty} Units
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>₱{product.containerDeposit}</td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button 
                                                        onClick={() => openEditModal(product)}
                                                        style={{ padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-muted)', cursor: 'pointer' }}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(product._id)}
                                                        style={{ padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid #FCA5A5', background: 'var(--badge-red-bg)', color: '#EF4444', cursor: 'pointer' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
                                                {loading ? 'Loading products...' : 'No products found. Start by adding one!'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>

            <ProductModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProduct}
                product={editingProduct}
            />

            <ProductSelectionModal 
                isOpen={isSelectionModalOpen}
                onClose={() => setIsSelectionModalOpen(false)}
                product={selectedProduct}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                mode={selectionMode}
            />
        </div>
    );
};

export default ProductsPage;
