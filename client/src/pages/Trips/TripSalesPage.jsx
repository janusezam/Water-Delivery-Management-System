import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { Truck, Plus, Eye, CheckCircle, Ban, MapPin, Package, X, PhilippinePeso } from 'lucide-react';
import { getTrips, createTrip, completeTrip, cancelTrip } from '../../services/tripSaleService';
import { getDrivers } from '../../services/driverService';
import { getProducts } from '../../services/productService';
import { toast } from 'react-hot-toast';

const TripSalesPage = () => {
    const userProfile = JSON.parse(localStorage.getItem('user') || '{}');
    const [trips, setTrips] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);

    const fetchTrips = async () => {
        try {
            setLoading(true);
            const { data } = await getTrips();
            setTrips(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching trips', error);
            setLoading(false);
            toast.error('Failed to load trips');
        }
    };

    const fetchDependencies = async () => {
        try {
            const [driversRes, productsRes] = await Promise.all([
                getDrivers(),
                getProducts()
            ]);
            setDrivers(driversRes.data.filter(d => d.status === 'available'));
            setProducts(productsRes.data.filter(p => p.isActive));
        } catch (error) {
            console.error('Error fetching dependencies', error);
        }
    };

    useEffect(() => {
        fetchTrips();
        fetchDependencies();
    }, []);

    const handleCreateTrip = async (e, formData) => {
        e.preventDefault();
        try {
            await createTrip(formData);
            toast.success('Trip created and dispatched!');
            setIsCreateModalOpen(false);
            fetchTrips();
            fetchDependencies(); // Refresh available drivers/products
        } catch (error) {
            console.error('Backend Error Details:', error.response?.data?.stack || error.response?.data?.message || error.message);
            toast.error(error.response?.data?.message || 'Failed to create trip');
        }
    };

    const handleCompleteTrip = async (e, returnedItems) => {
        e.preventDefault();
        try {
            await completeTrip(selectedTrip._id, { returnedItems });
            toast.success('Trip completed and inventory reconciled!');
            setIsVerifyModalOpen(false);
            fetchTrips();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to complete trip');
        }
    };

    const handleCancelTrip = async (tripId) => {
        if (!window.confirm('Are you sure you want to cancel this trip? All loaded items will be returned to stock.')) return;
        try {
            await cancelTrip(tripId);
            toast.success('Trip cancelled');
            fetchTrips();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel trip');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <span style={{ background: '#DBEAFE', color: '#1D4ED8', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Active</span>;
            case 'pending_review': return <span style={{ background: '#FEF9C3', color: '#B45309', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Pending Review</span>;
            case 'completed': return <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Completed</span>;
            case 'cancelled': return <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Cancelled</span>;
            default: return <span>{status}</span>;
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--page-bg)' }}>
            <Sidebar role={userProfile.role} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header breadcrumbs={['Trip Sales']} />

                <main style={{ padding: '2rem 3rem' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
                                Roaming Trip Sales
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
                                Manage door-to-door sales trips, load stock, and reconcile inventory.
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="btn-primary" 
                            style={{ background: '#4F46E5', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontWeight: '600', color: 'white', border: 'none', cursor: 'pointer' }}
                        >
                            <Plus size={20} />
                            <span>Create Trip</span>
                        </button>
                    </header>

                    <div className="glass" style={{ background: 'var(--surface-bg)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--page-bg)', borderBottom: '1px solid var(--surface-hover)' }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Receipt No</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Driver</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Items Loaded</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trips.length > 0 ? trips.map((trip) => (
                                    <tr key={trip._id} style={{ borderBottom: '1px solid var(--surface-hover)' }}>
                                        <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#4F46E5' }}>{trip.receiptNo}</td>
                                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: 'var(--text-main)' }}>{trip.driver?.name || 'Unknown'}</td>
                                        <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {trip.loadedItems.map(i => `${i.qtyLoaded}x ${i.product?.name}`).join(', ')}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>₱{trip.totalRevenue}</td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>{getStatusBadge(trip.status)}</td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button onClick={() => { setSelectedTrip(trip); setIsProgressModalOpen(true); }} style={{ color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }} title="View Progress">
                                                    <Eye size={18} />
                                                </button>
                                                {trip.status === 'pending_review' && (
                                                    <button onClick={() => { setSelectedTrip(trip); setIsVerifyModalOpen(true); }} style={{ color: '#10B981', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }} title="Verify & Complete">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                {trip.status === 'active' && userProfile.role === 'admin' && (
                                                    <button onClick={() => handleCancelTrip(trip._id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }} title="Cancel Trip">
                                                        <Ban size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>
                                            {loading ? 'Loading trips...' : 'No trips found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>

            {/* Create Trip Modal */}
            {isCreateModalOpen && (
                <CreateTripModal 
                    onClose={() => setIsCreateModalOpen(false)} 
                    onSave={handleCreateTrip} 
                    drivers={drivers} 
                    products={products} 
                />
            )}

            {/* Verify Trip Modal */}
            {isVerifyModalOpen && selectedTrip && (
                <VerifyTripModal 
                    trip={selectedTrip} 
                    onClose={() => setIsVerifyModalOpen(false)} 
                    onSave={handleCompleteTrip} 
                />
            )}

            {/* View Progress Modal */}
            {isProgressModalOpen && selectedTrip && (
                <ViewTripProgressModal 
                    trip={selectedTrip} 
                    onClose={() => setIsProgressModalOpen(false)} 
                />
            )}
        </div>
    );
};

const CreateTripModal = ({ onClose, onSave, drivers, products }) => {
    const [driver, setDriver] = useState('');
    const [notes, setNotes] = useState('');
    // Initialize all products with qtyLoaded: 0 so they show as cards
    const [productItems, setProductItems] = useState(
        products.map(p => ({ product: p._id, qtyLoaded: 0, pricePerUnit: p.pricePerUnit, productData: p }))
    );

    const updateQty = (index, delta) => {
        const newItems = [...productItems];
        const item = newItems[index];
        const newQty = item.qtyLoaded + delta;
        if (newQty >= 0 && newQty <= item.productData.stockQty) {
            item.qtyLoaded = newQty;
            setProductItems(newItems);
        }
    };

    const handleSubmit = (e) => {
        const loadedItems = productItems
            .filter(i => i.qtyLoaded > 0)
            .map(i => ({ product: i.product, qtyLoaded: i.qtyLoaded, pricePerUnit: i.pricePerUnit }));
        onSave(e, { driver, notes, loadedItems });
    };

    const totalItemsSelected = productItems.reduce((sum, i) => sum + i.qtyLoaded, 0);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '90vw', maxWidth: '680px', background: 'var(--surface-bg)', borderRadius: '1.5rem', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.25rem' }}>Create Roaming Trip</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>Assign Driver</label>
                        <select required value={driver} onChange={e => setDriver(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)', boxSizing: 'border-box' }}>
                            <option value="">Select a driver...</option>
                            {drivers.map(d => <option key={d.user._id} value={d.user._id}>{d.user.name}</option>)}
                        </select>
                    </div>
                    
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.75rem' }}>Load Products onto Vehicle</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {productItems.map((item, i) => {
                                const p = item.productData;
                                const isSelected = item.qtyLoaded > 0;
                                return (
                                    <div key={p._id} style={{ 
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                        padding: '0.75rem', 
                                        border: isSelected ? '2px solid #4F46E5' : '1px solid var(--border-light)', 
                                        borderRadius: '0.75rem', 
                                        background: isSelected ? '#EEF2FF' : 'var(--page-bg)',
                                        transition: 'all 0.2s ease',
                                        opacity: p.stockQty === 0 ? 0.5 : 1
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} alt={p.name} style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--border-light)' }} />
                                            ) : (
                                                <div style={{ width: '52px', height: '52px', background: 'var(--surface-hover)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Package size={24} color="var(--text-light)" />
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>{p.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                                    ₱{p.pricePerUnit}/unit • {p.stockQty > 0 ? <span style={{ color: '#10B981', fontWeight: '600' }}>{p.stockQty} in warehouse</span> : <span style={{ color: '#EF4444', fontWeight: '600' }}>Out of stock</span>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <button 
                                                type="button" 
                                                disabled={item.qtyLoaded === 0}
                                                onClick={() => updateQty(i, -1)} 
                                                style={{ width: '36px', height: '36px', borderRadius: '0.5rem', border: '1px solid var(--border-medium)', background: 'var(--surface-bg)', cursor: item.qtyLoaded === 0 ? 'not-allowed' : 'pointer', fontSize: '1.25rem', fontWeight: '700', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                −
                                            </button>
                                            <span style={{ fontSize: '1.1rem', fontWeight: '800', minWidth: '30px', textAlign: 'center', color: isSelected ? '#4F46E5' : 'var(--text-main)' }}>{item.qtyLoaded}</span>
                                            <button 
                                                type="button" 
                                                disabled={item.qtyLoaded >= p.stockQty}
                                                onClick={() => updateQty(i, 1)} 
                                                style={{ width: '36px', height: '36px', borderRadius: '0.5rem', border: '1px solid var(--border-medium)', background: 'var(--surface-bg)', cursor: item.qtyLoaded >= p.stockQty ? 'not-allowed' : 'pointer', fontSize: '1.25rem', fontWeight: '700', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem' }}>Notes (Optional)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2" placeholder="Any special instructions for the driver..." style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)', boxSizing: 'border-box' }}></textarea>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Package size={16} color="var(--text-muted)" />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{totalItemsSelected} items to load</span>
                        </div>
                        <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '700', color: 'var(--text-muted)' }}>Cancel</button>
                        <button type="submit" disabled={totalItemsSelected === 0 || !driver} style={{ padding: '0.75rem 1.5rem', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '700', opacity: (totalItemsSelected === 0 || !driver) ? 0.6 : 1 }}>Dispatch Trip</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const VerifyTripModal = ({ trip, onClose, onSave }) => {
    const [returnedItems, setReturnedItems] = useState(
        trip.loadedItems.map(item => {
            // Auto-calculate expected returns based on loaded - sold
            let soldQty = 0;
            trip.sales.forEach(sale => {
                const saleItem = sale.items.find(i => i.product._id === item.product._id);
                if (saleItem) soldQty += saleItem.qty;
            });
            return {
                product: item.product._id,
                name: item.product.name,
                qtyLoaded: item.qtyLoaded,
                qtySold: soldQty,
                qtyReturned: Math.max(0, item.qtyLoaded - soldQty)
            };
        })
    );

    const updateReturned = (index, val) => {
        const newArr = [...returnedItems];
        newArr[index].qtyReturned = val;
        setReturnedItems(newArr);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '90vw', maxWidth: '600px', background: 'var(--surface-bg)', borderRadius: '1.5rem', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontWeight: '800', fontSize: '1.25rem' }}>Verify & Complete Trip</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Driver: <strong>{trip.driver?.name}</strong> • Revenue to collect: <strong>₱{trip.sales.reduce((sum, s) => sum + s.totalAmount, 0)}</strong>
                </p>

                <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#374151' }}>Inventory Reconciliation</h4>
                    {returnedItems.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E5E7EB' }}>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Loaded: {item.qtyLoaded} • Sold: {item.qtySold}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Actual Returned:</label>
                                <input type="number" min="0" max={item.qtyLoaded} value={item.qtyReturned} onChange={e => updateReturned(i, parseInt(e.target.value) || 0)} style={{ width: '70px', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #D1D5DB', textAlign: 'center' }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                    <button type="button" onClick={(e) => onSave(e, returnedItems.map(i => ({ product: i.product, qtyReturned: i.qtyReturned })))} style={{ padding: '0.75rem 1.5rem', background: '#10B981', color: 'white', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '700' }}>Confirm & Restore Stock</button>
                </div>
            </div>
        </div>
    );
};

const ViewTripProgressModal = ({ trip, onClose }) => {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '90vw', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface-bg)', borderRadius: '1.5rem', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Truck size={20} color="#4F46E5" /> Trip Progress: {trip.receiptNo}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={20} /></button>
                </div>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Driver: <strong>{trip.driver?.name}</strong> • Current Revenue: <strong>₱{trip.sales.reduce((sum, s) => sum + s.totalAmount, 0)}</strong>
                </p>

                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#4338CA' }}>Inventory Remaining</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
                    {trip.loadedItems.map(item => {
                        let sold = 0;
                        trip.sales.forEach(sale => {
                            const saleItem = sale.items.find(i => i.product._id === item.product._id);
                            if (saleItem) sold += saleItem.qty;
                        });
                        const remaining = item.qtyLoaded - sold;
                        const pct = (remaining / item.qtyLoaded) * 100;
                        return (
                            <div key={item.product._id} style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', color: '#3730A3', marginBottom: '0.25rem' }}>
                                    <span>{item.product.name}</span>
                                    <span>{remaining} / {item.qtyLoaded} left</span>
                                </div>
                                <div style={{ height: '8px', background: '#C7D2FE', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: remaining > 0 ? '#4F46E5' : '#EF4444', transition: 'width 0.3s' }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#4338CA' }}>Sales Log</h4>
                {trip.sales && trip.sales.length > 0 ? (
                    <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {trip.sales.map((sale, idx) => (
                            <div key={idx} style={{ 
                                background: '#F9FAFB', border: '1px solid #E5E7EB', 
                                borderRadius: '0.75rem', padding: '1rem', marginBottom: '0.75rem' 
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: '700', color: '#111827', fontSize: '0.95rem' }}>
                                        {sale.customerName || 'Walk-up Customer'}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                                        {new Date(sale.soldAt || sale.createdAt || Date.now()).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#4B5563', marginBottom: '0.5rem' }}>
                                    {sale.items.map((item, i) => (
                                        <div key={i} style={{ marginBottom: '0.25rem' }}>
                                            <strong>{item.qty}x</strong> {item.product?.name || 'Item'} (₱{item.price}/ea)
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                                        {sale.jugsCollected > 0 ? `${sale.jugsCollected} jugs collected` : 'No jugs returned'}
                                    </span>
                                    <span style={{ fontWeight: '800', color: '#10B981' }}>
                                        Total: ₱{sale.totalAmount}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center', background: '#F9FAFB', borderRadius: '0.75rem', border: '1px dashed #E5E7EB', color: '#6B7280', fontSize: '0.85rem' }}>
                        No sales recorded yet.
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: 'var(--surface-hover)', color: 'var(--text-main)', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: '700' }}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default TripSalesPage;
