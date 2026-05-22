import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { ShoppingCart, Minus, Plus, MapPin, CheckCircle2, Trash2, ArrowLeft, Package } from 'lucide-react';
import { getProducts, getCustomers, createOrder } from '../../services';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CartPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const buyNowItem = location.state?.buyNowItem;

    const [isBuyNow] = useState(!!buyNowItem);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState(() => {
        if (isBuyNow && location.state?.buyNowItem) {
            return [location.state.buyNowItem];
        }
        return JSON.parse(localStorage.getItem('user_cart') || '[]');
    });

    const getItemKey = (item) => `${item.product._id}-${item.payDeposit ? 'deposit' : 'no'}`;
    const [selectedItems, setSelectedItems] = useState(() => {
        if (buyNowItem) return [getItemKey(buyNowItem)];
        return [];
    });
    const [step, setStep] = useState(buyNowItem ? 2 : 1); // 1: Review, 2: Checkout
    const [address, setAddress] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [coordinates, setCoordinates] = useState({ lat: 14.5995, lng: 120.9842 }); // Default to Manila
    const [customerId, setCustomerId] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTimeout, setSearchTimeout] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!isBuyNow) {
            localStorage.setItem('user_cart', JSON.stringify(cart));
        }
    }, [cart, isBuyNow]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, custRes] = await Promise.all([getProducts(), getCustomers()]);
                setProducts(prodRes.data.filter(p => p.isActive !== false));
                
                const customerProfile = custRes.data.find(c => c.user === user._id || c.name === user.name);
                if (customerProfile) {
                    setCustomerId(customerProfile._id);
                    if (customerProfile.addresses?.length > 0) {
                        const mainAddr = customerProfile.addresses[0];
                        setAddress(`${mainAddr.street}, ${mainAddr.barangay}`);
                        if (mainAddr.lat && mainAddr.lng) {
                            setCoordinates({ lat: mainAddr.lat, lng: mainAddr.lng });
                        }
                    }
                }
                
                // Auto-select all items by default if none selected
                if (selectedItems.length === 0 && cart.length > 0) {
                    setSelectedItems(cart.map(getItemKey));
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Error loading cart data:', error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const data = await res.json();
            if (data && data.display_name) {
                setAddress(data.display_name);
            }
        } catch (err) {
            console.error('Reverse geocode error:', err);
        }
    };

    const detectLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setCoordinates({ lat, lng });
                reverseGeocode(lat, lng); // Auto-fill the address field
            }, (error) => {
                console.error("Error detecting location:", error);
                toast.error("Could not detect your location. Please pin it manually.");
            });
        }
    };

    useEffect(() => {
        if (step === 2) {
            detectLocation();
        }
    }, [step]);

    const handleAddressChange = (e) => {
        const value = e.target.value;
        setAddress(value);

        if (searchTimeout) clearTimeout(searchTimeout);

        if (value.length > 3) {
            setSearchTimeout(setTimeout(async () => {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=ph&limit=5`);
                    const data = await response.json();
                    setSuggestions(data);
                } catch (error) {
                    console.error("Geocoding error:", error);
                }
            }, 800));
        } else {
            setSuggestions([]);
        }
    };

    const selectSuggestion = (suggestion) => {
        setAddress(suggestion.display_name);
        setCoordinates({
            lat: parseFloat(suggestion.lat),
            lng: parseFloat(suggestion.lon)
        });
        setSuggestions([]);
    };

    const updateQty = (id, delta, payDeposit) => {
        setCart(prev => {
            const newCart = prev.map(item => {
                if (item.product._id === id && item.payDeposit === payDeposit) {
                    const productData = products.find(p => p._id === id);
                    const maxStock = productData ? productData.stockQty : 999;
                    const newQty = Math.max(1, Math.min(maxStock, item.qty + delta));
                    
                    if (delta > 0 && item.qty >= maxStock) {
                        toast.error(`Only ${maxStock} units available in stock`);
                    }
                    
                    return { ...item, qty: newQty };
                }
                return item;
            });
            if (!isBuyNow) localStorage.setItem('user_cart', JSON.stringify(newCart));
            return newCart;
        });
    };

    const removeFromCart = (id, payDeposit) => {
        setCart(prev => {
            const newCart = prev.filter(item => !(item.product._id === id && item.payDeposit === payDeposit));
            if (!isBuyNow) localStorage.setItem('user_cart', JSON.stringify(newCart));
            return newCart;
        });
        const key = `${id}-${payDeposit ? 'deposit' : 'no'}`;
        setSelectedItems(prev => prev.filter(i => i !== key));
    };

    const toggleSelection = (key) => {
        setSelectedItems(prev => 
            prev.includes(key) ? prev.filter(i => i !== key) : [...prev, key]
        );
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === cart.length && cart.length > 0) {
            setSelectedItems([]);
        } else {
            setSelectedItems(cart.map(getItemKey));
        }
    };

    const totalAmount = cart
        .filter(item => selectedItems.includes(getItemKey(item)))
        .reduce((sum, item) => {
            const deposit = item.payDeposit ? (item.product.containerDeposit || 0) * item.qty : 0;
            return sum + (item.product.pricePerUnit * item.qty) + deposit;
        }, 0);

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (!address.trim()) return alert('Please enter a delivery address');
        
        try {
            const itemsToCheckout = cart.filter(item => selectedItems.includes(getItemKey(item)));
            const payload = {
                customerName: user.name,
                user: user._id,
                address: address,
                coordinates: coordinates,
                items: itemsToCheckout.map(item => ({
                    product: item.product._id,
                    productName: item.product.name,
                    qty: item.qty,
                    price: item.product.pricePerUnit,
                    payDeposit: item.payDeposit,
                    depositAmount: item.payDeposit ? (item.product.containerDeposit || 0) : 0
                })),
                totalAmount: totalAmount,
                status: 'pending'
            };
            
            await createOrder(payload);
            
            if (isBuyNow) {
                toast.success('Direct order placed successfully!');
                navigate('/orders');
                return;
            }

            // Remove checked out items from cart
            const remainingCart = cart.filter(item => !selectedItems.includes(getItemKey(item)));
            setCart(remainingCart);
            
            toast.success('Order placed successfully!');
            navigate('/orders');
        } catch (error) {
            console.error('Checkout Error:', error);
            toast.error('Failed to place order');
        }
    };

    const LocationPicker = () => {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                setCoordinates({ lat, lng });
                reverseGeocode(lat, lng); // Auto-fill address when map is clicked
            },
        });
        return coordinates ? <Marker position={coordinates} /> : null;
    };

    const MapController = ({ center }) => {
        const map = useMapEvents({});
        useEffect(() => {
            if (center) {
                map.setView(center, map.getZoom());
            }
        }, [center]);
        return null;
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <Sidebar role="user" />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['Shopping Cart']} />

                <main style={{ padding: '2rem 3rem' }}>
                    <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button 
                            onClick={() => navigate('/products')}
                            style={{ background: 'var(--surface-bg)', border: '1px solid var(--border-light)', padding: '0.5rem', borderRadius: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>Shopping Cart</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>{step === 1 ? 'Review your items before checkout' : 'Confirm delivery details'}</p>
                        </div>
                    </header>

                    {cart.length === 0 ? (
                        <div style={{ background: 'var(--surface-bg)', borderRadius: '1.5rem', padding: '5rem 2rem', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                            <div style={{ opacity: 0.1, color: '#4F46E5', marginBottom: '1.5rem' }}>
                                <ShoppingCart size={80} style={{ margin: '0 auto' }} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1rem' }}>Your cart is empty</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Looks like you haven't added anything to your cart yet.</p>
                            <button 
                                onClick={() => navigate('/products')}
                                className="btn-primary" 
                                style={{ margin: '0 auto', background: '#4F46E5', padding: '1rem 2.5rem' }}
                            >
                                Browse Products
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
                            {/* Left Column: Items or Checkout Form */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {step === 1 ? (
                                    <div style={{ background: 'var(--surface-bg)', borderRadius: '1.5rem', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>Items in Cart ({cart.length})</h4>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#4F46E5', fontWeight: '600' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedItems.length === cart.length && cart.length > 0} 
                                                    onChange={toggleSelectAll}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                Select All
                                            </label>
                                        </div>
                                        <div style={{ padding: '0 1.5rem' }}>
                                            {cart.map((item, idx) => {
                                                const key = getItemKey(item);
                                                const isSelected = selectedItems.includes(key);
                                                const itemSubtotal = item.product.pricePerUnit * item.qty;
                                                const itemDeposit = item.payDeposit ? (item.product.containerDeposit || 0) * item.qty : 0;
                                                const itemTotal = itemSubtotal + itemDeposit;

                                                return (
                                                    <div key={key} style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        alignItems: 'center', 
                                                        padding: '1.5rem 0', 
                                                        borderBottom: idx === cart.length - 1 ? 'none' : '1px solid var(--surface-hover)',
                                                        opacity: isSelected ? 1 : 0.6
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isSelected} 
                                                                onChange={() => toggleSelection(key)}
                                                                style={{ cursor: 'pointer', width: '20px', height: '20px', accentColor: '#4F46E5' }}
                                                            />
                                                            <div style={{ width: '64px', height: '64px', background: 'var(--page-bg)', borderRadius: '1rem', border: '1px solid var(--border-light)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                                                                {item.product.imageUrl ? (
                                                                    <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <Package size={24} color="#4F46E5" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p style={{ fontWeight: '700', color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
                                                                    {item.product.name}
                                                                    {item.payDeposit && <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#4F46E5', marginLeft: '0.5rem', background: 'var(--badge-blue-bg)', padding: '0.15rem 0.4rem', borderRadius: '0.4rem', verticalAlign: 'middle' }}>+ DEPOSIT</span>}
                                                                </p>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>₱{item.product.pricePerUnit} / unit</p>
                                                                    <span style={{ 
                                                                        fontSize: '0.7rem', 
                                                                        fontWeight: '700', 
                                                                        color: (products.find(p => p._id === item.product._id)?.stockQty || 0) > 0 ? '#10B981' : '#EF4444',
                                                                        background: (products.find(p => p._id === item.product._id)?.stockQty || 0) > 0 ? '#ECFDF5' : '#FEF2F2',
                                                                        padding: '0.15rem 0.5rem',
                                                                        borderRadius: '0.5rem'
                                                                    }}>
                                                                        {products.find(p => p._id === item.product._id)?.stockQty || 0} In Stock
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-hover)', borderRadius: '0.75rem', padding: '0.375rem' }}>
                                                                <button onClick={() => updateQty(item.product._id, -1, item.payDeposit)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', padding: '0.25rem' }}><Minus size={16} /></button>
                                                                <span style={{ fontWeight: '800', minWidth: '28px', textAlign: 'center', color: 'var(--text-main)' }}>{item.qty}</span>
                                                                <button onClick={() => updateQty(item.product._id, 1, item.payDeposit)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', padding: '0.25rem' }}><Plus size={16} /></button>
                                                            </div>
                                                            <div style={{ textAlign: 'right', minWidth: '100px' }}>
                                                                <p style={{ fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>₱{itemTotal.toFixed(2)}</p>
                                                                <button onClick={() => removeFromCart(item.product._id, item.payDeposit)} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', padding: 0, marginTop: '0.25rem' }}>Remove</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div style={{ background: 'var(--surface-bg)', borderRadius: '1.5rem', padding: '2rem', border: '1px solid var(--border-light)' }}>
                                            <h4 style={{ fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                                <MapPin size={22} color="#4F46E5" /> Delivery Information
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                                                <label style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>Delivery Address</label>
                                                <textarea 
                                                    value={address}
                                                    onChange={handleAddressChange}
                                                    placeholder="Search for your address or enter manually..."
                                                    style={{ 
                                                        width: '100%', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border-medium)',
                                                        minHeight: '100px', resize: 'none', fontSize: '1.1rem', outline: 'none',
                                                        transition: 'border-color 0.2s',
                                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                                    }}
                                                />
                                                {suggestions.length > 0 && (
                                                    <div style={{ 
                                                        position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface-bg)', 
                                                        zIndex: 1000, borderRadius: '0.75rem', border: '1px solid var(--border-light)', 
                                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', marginTop: '0.25rem', overflow: 'hidden'
                                                    }}>
                                                        {suggestions.map((s, i) => (
                                                            <div 
                                                                key={i} 
                                                                onClick={() => selectSuggestion(s)}
                                                                style={{ 
                                                                    padding: '0.75rem 1rem', 
                                                                    cursor: 'pointer', 
                                                                    fontSize: '0.875rem', 
                                                                    color: 'var(--text-main)', // Dark text
                                                                    background: 'var(--surface-bg)',
                                                                    borderBottom: i === suggestions.length - 1 ? 'none' : '1px solid var(--surface-hover)'
                                                                }}
                                                                onMouseOver={(e) => e.currentTarget.style.background = '#F9FAFB'}
                                                                onMouseOut={(e) => e.currentTarget.style.background = 'var(--surface-bg)'}
                                                            >
                                                                {s.display_name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Start typing to see address suggestions.</p>
                                            </div>

                                            <div style={{ marginTop: '2rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                    <label style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                                                        Pin your exact location on the map
                                                    </label>
                                                    <button 
                                                        onClick={detectLocation}
                                                        style={{ 
                                                            fontSize: '0.85rem', fontWeight: '700', color: 'white', background: '#4F46E5',
                                                            border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', cursor: 'pointer',
                                                            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                                                        }}
                                                    >
                                                        Use Current Location
                                                    </button>
                                                </div>
                                                <div style={{ height: '450px', borderRadius: '1.5rem', overflow: 'hidden', border: '2px solid var(--border-light)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                                    <MapContainer 
                                                        center={coordinates} 
                                                        zoom={15} 
                                                        style={{ height: '100%', width: '100%' }}
                                                    >
                                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                        <LocationPicker />
                                                        <MapController center={coordinates} />
                                                    </MapContainer>
                                                </div>
                                                <p style={{ fontSize: '0.75rem', color: '#4F46E5', marginTop: '0.75rem', fontWeight: '600' }}>
                                                    Click on the map to move the pin to your exact delivery spot.
                                                </p>
                                            </div>
                                        </div>
                                        </div>
                                    )}
                                </div>

                            {/* Right Column: Checkout Summary */}
                            <div style={{ position: 'sticky', top: '2rem' }}>
                                <div style={{ background: 'var(--surface-bg)', borderRadius: '1.5rem', padding: '2rem', border: '1px solid var(--border-light)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <h4 style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '1.5rem' }}>Order Total</h4>
                                    
                                    {/* Itemized Summary */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px dashed var(--border-light)' }}>
                                        {cart.filter(item => selectedItems.includes(getItemKey(item))).map(item => {
                                            const key = getItemKey(item);
                                            const itemSubtotal = item.product.pricePerUnit * item.qty;
                                            const itemDeposit = item.payDeposit ? (item.product.containerDeposit || 0) * item.qty : 0;
                                            return (
                                                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>
                                                            {item.product.name} x {item.qty}
                                                            <span style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: '700' }}> ({item.payDeposit ? 'Deposit' : 'No Deposit'})</span>
                                                        </span>
                                                        <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>₱{(itemSubtotal + itemDeposit).toFixed(2)}</span>
                                                    </div>
                                                    {item.payDeposit && (
                                                        <span style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: '600' }}>
                                                            Includes ₱{itemDeposit} Container Deposit
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                            <span>Subtotal</span>
                                            <span>₱{totalAmount.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                            <span>Delivery Fee</span>
                                            <span style={{ color: '#10B981', fontWeight: '600' }}>FREE</span>
                                        </div>
                                        <div style={{ borderTop: '1px solid var(--surface-hover)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Total Amount</span>
                                            <span style={{ fontWeight: '900', fontSize: '1.5rem', color: '#4F46E5' }}>₱{totalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {step === 1 ? (
                                        <button 
                                            disabled={selectedItems.length === 0}
                                            onClick={() => setStep(2)}
                                            className="btn-primary" 
                                            style={{ 
                                                width: '100%', padding: '1.25rem', borderRadius: '1.25rem', 
                                                background: selectedItems.length === 0 ? 'var(--border-medium)' : '#4F46E5',
                                                cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            Proceed to Checkout
                                        </button>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <button 
                                                onClick={handleCheckout}
                                                className="btn-primary" 
                                                style={{ width: '100%', padding: '1.25rem', borderRadius: '1.25rem', background: '#10B981' }}
                                            >
                                                <CheckCircle2 size={20} /> Place Order
                                            </button>
                                            <button 
                                                onClick={() => setStep(1)}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', padding: '0.5rem' }}
                                            >
                                                Back to Cart
                                            </button>
                                        </div>
                                    )}
                                    
                                    <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
                                        By placing an order, you agree to our Terms of Service.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CartPage;
