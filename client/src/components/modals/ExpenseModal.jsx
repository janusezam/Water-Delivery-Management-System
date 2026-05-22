import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Lock, Loader2 } from 'lucide-react';
import { getDrivers } from '../../services';

const ExpenseModal = ({ isOpen, onClose, onSave, expense }) => {
    const [drivers, setDrivers] = useState([]);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().slice(0, 10),
        driver: '',
        odometer: '',
        liters: '',
        price_per_liter: '',
        fuel_station: '',
        notes: '',
        receiptPhoto: null
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
                    const [driversRes] = await Promise.all([
                        getDrivers()
                    ]);
                    setDrivers(driversRes.data);
                    
                    if (expense) {
                        setFormData({
                            date: expense.date ? new Date(expense.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                            driver: expense.driver?._id || expense.driver || '',
                            odometer: expense.odometer || '',
                            liters: expense.liters || '',
                            price_per_liter: expense.price_per_liter || expense.pricePerLiter || '',
                            fuel_station: expense.fuel_station || '',
                            notes: expense.notes || '',
                            receiptPhoto: null
                        });
                        setPreviewUrl(expense.receipt_photo_url || expense.receiptPhoto || null);
                    } else {
                        setFormData({
                            date: new Date().toISOString().slice(0, 10),
                            driver: '',
                            odometer: '',
                            liters: '',
                            price_per_liter: '',
                            fuel_station: '',
                            notes: '',
                            receiptPhoto: null
                        });
                        setPreviewUrl(null);
                        
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

    const litersNum = parseFloat(formData.liters) || 0;
    const priceNum = parseFloat(formData.price_per_liter) || 0;
    const computedTotalCost = (litersNum * priceNum).toFixed(2);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Show optimistic preview
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            setFormData(prev => ({ ...prev, receiptPhoto: file }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.receiptPhoto && !previewUrl) {
            alert('A receipt photo is required.');
            return;
        }
        
        if (formData.odometer && parseFloat(formData.odometer) <= 0) {
            alert('Odometer reading must be greater than zero.');
            return;
        }

        const payload = {
            date: formData.date,
            driver: formData.driver,
            odometer: formData.odometer ? parseFloat(formData.odometer) : null,
            liters: litersNum,
            pricePerLiter: priceNum,
            totalCost: parseFloat(computedTotalCost),
            fuel_station: formData.fuel_station || '',
            notes: formData.notes || '',
            receiptPhoto: formData.receiptPhoto
        };
        
        // Using "pricePerLiter" and "totalCost", and "trip" instead of "_id" to adhere exactly 
        // to backend schema expectations in GasExpense.js and expenseController.js while 
        // leveraging the native backend Multer Cloudinary uploader.
        
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
                        {expense ? 'Edit Gas Fill-up' : 'Log Gas Fill-up'}
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
                    
                    {/* Date and Driver Fields */}
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

                    {/* Odometer */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Current odometer reading (km)</label>
                        <input 
                            type="number" 
                            step="0.1"
                            min="0.1"
                            disabled={isLocked}
                            placeholder="e.g. 45200"
                            value={formData.odometer}
                            onChange={(e) => setFormData({...formData, odometer: e.target.value})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none' }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Helps track fuel efficiency over time</p>
                    </div>

                    {/* Liters and Price */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Liters Filled</label>
                            <input 
                                type="number" 
                                step="0.01"
                                min="0.01"
                                required
                                disabled={isLocked}
                                placeholder="e.g. 20.5"
                                value={formData.liters}
                                onChange={(e) => setFormData({...formData, liters: e.target.value})}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Price per Liter (₱)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                min="0.01"
                                required
                                disabled={isLocked}
                                placeholder="e.g. 58.00"
                                value={formData.price_per_liter}
                                onChange={(e) => setFormData({...formData, price_per_liter: e.target.value})}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Total Cost Output */}
                    <div style={{ background: '#EFF6FF', padding: '1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600', color: '#1E40AF', fontSize: '0.95rem' }}>Total Cost:</span>
                        <span style={{ fontWeight: '800', color: '#1E40AF', fontSize: '1.25rem' }}>₱{computedTotalCost}</span>
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
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Notes (Optional)</label>
                        <textarea 
                            disabled={isLocked}
                            placeholder="Any additional details..."
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)', outline: 'none', resize: 'vertical', minHeight: '80px' }}
                        />
                    </div>

                    {/* Receipt Upload */}
                    <div 
                        onClick={() => !isLocked && fileInputRef.current.click()}
                        style={{ 
                            padding: '1.5rem', border: '2px dashed var(--border-light)', borderRadius: '1rem', 
                            textAlign: 'center', cursor: isLocked ? 'default' : 'pointer', 
                            background: isLocked ? 'var(--input-disabled-bg)' : 'var(--input-bg)'
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
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload Receipt Photo (Required)</p>
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
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            style={{ 
                                padding: '1rem', 
                                borderRadius: '0.75rem', 
                                background: 'var(--accent-indigo)', 
                                color: 'white', 
                                fontWeight: '700', 
                                border: 'none', 
                                cursor: 'pointer', 
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' 
                            }}
                        >
                            {expense ? 'Update Expense' : 'Save Expense'}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;
