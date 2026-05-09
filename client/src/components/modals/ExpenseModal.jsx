import React, { useState, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import { getDrivers } from '../../services';

const ExpenseModal = ({ isOpen, onClose, onSave }) => {
    const [drivers, setDrivers] = useState([]);
    const [formData, setFormData] = useState({
        driver: '',
        liters: '',
        pricePerLiter: '',
        receiptPhoto: null
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isDriver = user.role === 'driver';

    useEffect(() => {
        if (isOpen) {
            const fetchDrivers = async () => {
                try {
                    const { data } = await getDrivers();
                    setDrivers(data);
                    
                    // If the current user is a driver, auto-select their driver record
                    if (isDriver) {
                        const myDriverRecord = data.find(d => d.user?._id === user._id);
                        if (myDriverRecord) {
                            setFormData(prev => ({ ...prev, driver: myDriverRecord._id }));
                        }
                    }
                } catch (error) {
                    console.error('Error fetching drivers:', error);
                }
            };
            fetchDrivers();
        }
    }, [isOpen, isDriver, user._id]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const totalCost = parseFloat(formData.liters) * parseFloat(formData.pricePerLiter);
        onSave({ ...formData, totalCost });
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
            backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content glass" style={{
                background: 'var(--modal-bg)',
                padding: '2rem',
                borderRadius: '1.5rem',
                width: '400px',
                position: 'relative'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={24} />
                </button>
                
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>Log Gas Expense</h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {!isDriver ? (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Driver</label>
                            <select 
                                required
                                value={formData.driver}
                                onChange={(e) => setFormData({...formData, driver: e.target.value})}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-dark)', background: 'white', outline: 'none' }}
                            >
                                <option value="">-- Select Driver --</option>
                                {drivers.map(d => <option key={d._id} value={d._id}>{d.user?.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div style={{ background: '#F3F4F6', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Logging as</p>
                            <p style={{ fontWeight: '800', color: 'var(--text-dark)' }}>{user.name}</p>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Liters</label>
                            <input 
                                type="number" 
                                step="0.01"
                                required
                                placeholder="0.00"
                                value={formData.liters}
                                onChange={(e) => setFormData({...formData, liters: e.target.value})}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-dark)', background: 'white', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Price/L (₱)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                required
                                placeholder="₱0.00"
                                value={formData.pricePerLiter}
                                onChange={(e) => setFormData({...formData, pricePerLiter: e.target.value})}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-dark)', background: 'white', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem', border: '2px dashed var(--border-light)', borderRadius: '1rem', textAlign: 'center', cursor: 'pointer' }}>
                        <Camera size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload Receipt Photo</p>
                        <input type="file" style={{ display: 'none' }} />
                    </div>

                    <button type="submit" className="btn-primary" style={{ padding: '1rem', borderRadius: '0.75rem', background: 'var(--accent-indigo)', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                        Save Expense
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;
