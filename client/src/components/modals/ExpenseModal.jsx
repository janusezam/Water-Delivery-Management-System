import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Lock } from 'lucide-react';
import { getDrivers, getTrips } from '../../services';

const ExpenseModal = ({ isOpen, onClose, onSave, expense }) => {
    const [drivers, setDrivers] = useState([]);
    const [trips, setTrips] = useState([]);
    const [unitDistance, setUnitDistance] = useState('kilometers');
    const [unitEfficiency, setUnitEfficiency] = useState('km/L');
    const [unitPrice, setUnitPrice] = useState('per liter');
    const [formData, setFormData] = useState({
        driver: '',
        trip: '',
        inputDistance: '',
        inputEfficiency: '',
        inputPrice: '',
        receiptPhoto: null,
        fuel_station: '',
        notes: '',
        date: new Date().toISOString().slice(0, 10)
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isDriver = user.role === 'driver';
    const isAdmin = user.role === 'admin';

    // Check if fields should be locked
    const isLocked = expense?.is_reviewed && !isAdmin;

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [driversRes, tripsRes] = await Promise.all([
                        getDrivers(),
                        getTrips()
                    ]);
                    setDrivers(driversRes.data);
                    
                    // Only show active trips for linking
                    const activeTrips = tripsRes.data.filter(t => t.status !== 'completed');
                    setTrips(activeTrips);
                    
                    if (expense) {
                        // Edit mode
                        setFormData({
                            driver: expense.driver?._id || expense.driver || '',
                            trip: expense.trip?._id || expense.trip || '',
                            inputPrice: expense.pricePerLiter || '',
                            receiptPhoto: null, // Don't pre-fill file input
                            inputDistance: expense.km_driven || '',
                            inputEfficiency: expense.km_per_liter || '',
                            fuel_station: expense.fuel_station || '',
                            notes: expense.notes || '',
                            date: expense.date ? new Date(expense.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
                        });
                        setUnitDistance('kilometers');
                        setUnitEfficiency('km/L');
                        setUnitPrice('per liter');
                        setPreviewUrl(expense.receiptPhoto || null);
                    } else {
                        // Create mode
                        setFormData({
                            driver: '',
                            trip: '',
                            inputPrice: '',
                            receiptPhoto: null,
                            inputDistance: '',
                            inputEfficiency: '',
                            fuel_station: '',
                            notes: '',
                            date: new Date().toISOString().slice(0, 10)
                        });
                        setUnitDistance('kilometers');
                        setUnitEfficiency('km/L');
                        setUnitPrice('per liter');
                        setPreviewUrl(null);
                        
                        // Auto-select driver
                        if (isDriver) {
                            const myDriverRecord = driversRes.data.find(d => d.user?._id === user._id);
                            if (myDriverRecord) {
                                setFormData(prev => ({ ...prev, driver: myDriverRecord._id }));
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            };
            fetchData();
        }
    }, [isOpen, isDriver, user._id, expense]);

    if (!isOpen) return null;

    // Conversion functions
    const getKmDriven = () => {
        const dist = parseFloat(formData.inputDistance) || 0;
        if (unitDistance === 'miles') return dist * 1.60934;
        return dist;
    };

    const getKmPerLiter = () => {
        const eff = parseFloat(formData.inputEfficiency) || 0;
        if (eff <= 0) return 0;
        if (unitEfficiency === 'mpg') return eff * 0.425144;
        if (unitEfficiency === 'L/100km') return 100 / eff;
        if (unitEfficiency === 'L/mile') return 1.60934 / eff;
        return eff; // km/L
    };

    const getPricePerLiter = () => {
        const p = parseFloat(formData.inputPrice) || 0;
        if (unitPrice === 'per gallon') return p / 3.78541;
        return p;
    };

    // Derived values
    const km_driven = getKmDriven();
    const km_per_liter = getKmPerLiter();
    const pricePerLiter = getPricePerLiter();

    let liters = 0;
    if (km_driven > 0 && km_per_liter > 0) {
        liters = (km_driven / km_per_liter).toFixed(2);
    }
    const totalCost = (liters * pricePerLiter).toFixed(2);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData({ ...formData, receiptPhoto: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            km_driven: getKmDriven().toFixed(2),
            km_per_liter: getKmPerLiter().toFixed(2),
            pricePerLiter: getPricePerLiter().toFixed(2)
        };
        // Clean up UI-only fields
        delete payload.inputDistance;
        delete payload.inputEfficiency;
        delete payload.inputPrice;
        
        onSave(payload);
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            overflowY: 'auto',
            padding: '2rem 0'
        }}>
            <div className="modal-content glass" style={{
                background: 'var(--modal-bg)',
                padding: '2rem',
                borderRadius: '1.5rem',
                width: '650px',
                maxWidth: '90vw',
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={24} />
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                        {expense ? 'Edit Gas Expense' : 'Log Gas Expense'}
                    </h3>
                    {expense?.createdBy?.role === 'admin' ? (
                        <span style={{ background: '#E0E7FF', color: '#3730A3', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Lock size={12} />
                            Logged by Admin
                        </span>
                    ) : expense?.is_reviewed ? (
                        <span style={{ background: '#D1FAE5', color: '#065F46', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Lock size={12} />
                            Reviewed
                        </span>
                    ) : null}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Date</label>
                            <input 
                                type="date" 
                                required
                                disabled={isLocked}
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none' }}
                            />
                        </div>
                        
                        {!isDriver ? (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Driver</label>
                                <select 
                                    required
                                    disabled={isLocked}
                                    value={formData.driver}
                                    onChange={(e) => setFormData({...formData, driver: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none' }}
                                >
                                    <option value="">-- Select Driver --</option>
                                    {drivers.map(d => <option key={d._id} value={d._id}>{d.user?.name}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Logging as</label>
                                <div style={{ background: 'var(--surface-hover)', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', fontWeight: '600', color: 'var(--text-main)' }}>
                                    {user.name}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Link to Trip (Optional)</label>
                        <select 
                            value={formData.trip}
                            disabled={isLocked}
                            onChange={(e) => setFormData({...formData, trip: e.target.value})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none' }}
                        >
                            <option value="">-- No Trip Linked --</option>
                            {trips.map(t => (
                                <option key={t._id} value={t._id}>
                                    {new Date(t.createdAt).toLocaleDateString()} - {t.driver?.user?.name || 'Trip'} ({t.status})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Trip Distance</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    disabled={isLocked}
                                    placeholder="e.g. 50"
                                    value={formData.inputDistance}
                                    onChange={(e) => setFormData({...formData, inputDistance: e.target.value})}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none' }}
                                />
                                <select 
                                    value={unitDistance}
                                    onChange={(e) => setUnitDistance(e.target.value)}
                                    disabled={isLocked}
                                    style={{ width: '120px', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none', color: 'var(--text-main)' }}
                                >
                                    <option value="kilometers">kilometers (km)</option>
                                    <option value="miles">miles</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Fuel Efficiency</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    disabled={isLocked}
                                    placeholder="e.g. 10.5"
                                    value={formData.inputEfficiency}
                                    onChange={(e) => setFormData({...formData, inputEfficiency: e.target.value})}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none' }}
                                />
                                <select 
                                    value={unitEfficiency}
                                    onChange={(e) => setUnitEfficiency(e.target.value)}
                                    disabled={isLocked}
                                    style={{ width: '180px', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none', color: 'var(--text-main)' }}
                                >
                                    <option value="km/L">kilometers per liter (km/L)</option>
                                    <option value="mpg">miles per gallon (mpg)</option>
                                    <option value="L/100km">liters per 100 km (L/100km)</option>
                                    <option value="L/mile">liters per mile</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Gas/Fuel Price</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    disabled={isLocked}
                                    placeholder="0.00"
                                    value={formData.inputPrice}
                                    onChange={(e) => setFormData({...formData, inputPrice: e.target.value})}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none' }}
                                />
                                <select 
                                    value={unitPrice}
                                    onChange={(e) => setUnitPrice(e.target.value)}
                                    disabled={isLocked}
                                    style={{ width: '120px', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none', color: 'var(--text-main)' }}
                                >
                                    <option value="per liter">per liter</option>
                                    <option value="per gallon">per gallon</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ background: '#EFF6FF', padding: '1rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: '#1E40AF', fontSize: '0.85rem' }}>Estimated Fuel Needed:</span>
                            <span style={{ fontWeight: '700', color: '#1E40AF', fontSize: '1rem' }}>{liters} L</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: '#1E40AF', fontSize: '0.95rem' }}>Total Estimated Cost:</span>
                            <span style={{ fontWeight: '800', color: '#1E40AF', fontSize: '1.25rem' }}>₱{totalCost}</span>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Fuel Station (Optional)</label>
                        <input 
                            type="text" 
                            disabled={isLocked}
                            placeholder="e.g. Shell, Petron..."
                            value={formData.fuel_station}
                            onChange={(e) => setFormData({...formData, fuel_station: e.target.value})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none' }}
                        />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Notes</label>
                        <textarea 
                            disabled={isLocked}
                            placeholder="Any additional details..."
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none', resize: 'vertical', minHeight: '80px' }}
                        />
                    </div>

                    <div 
                        onClick={() => !isLocked && fileInputRef.current.click()}
                        style={{ 
                            padding: '1.5rem', border: '2px dashed var(--border-light)', borderRadius: '1rem', 
                            textAlign: 'center', cursor: isLocked ? 'default' : 'pointer', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)'
                        }}
                    >
                        {previewUrl ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <img src={previewUrl} alt="Receipt Preview" style={{ maxHeight: '150px', borderRadius: '0.5rem', objectFit: 'contain' }} />
                                {!isLocked && <span style={{ fontSize: '0.8rem', color: 'var(--accent-indigo)', fontWeight: '600' }}>Click to change photo</span>}
                            </div>
                        ) : (
                            <>
                                <Camera size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload Receipt Photo</p>
                            </>
                        )}
                        <input 
                            type="file" 
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            disabled={isLocked}
                            style={{ display: 'none' }} 
                        />
                    </div>

                    {!isLocked && (
                        <button type="submit" className="btn-primary" style={{ padding: '1rem', borderRadius: '0.75rem', background: 'var(--accent-indigo)', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                            {expense ? 'Update Expense' : 'Save Expense'}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;
