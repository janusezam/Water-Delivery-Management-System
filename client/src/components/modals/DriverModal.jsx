import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const DriverModal = ({ isOpen, onClose, onSave, driver = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        vehicleType: 'tricycle',
        plateNo: ''
    });

    useEffect(() => {
        if (driver) {
            setFormData({
                name: driver.user?.name || driver.name || '',
                email: driver.user?.email || driver.email || '',
                vehicleType: driver.vehicleType || 'tricycle',
                plateNo: driver.plateNo || ''
            });
        } else {
            setFormData({
                name: '',
                email: '',
                password: '',
                vehicleType: 'tricycle',
                plateNo: ''
            });
        }
    }, [driver, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
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
                width: '400px',
                position: 'relative'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={24} />
                </button>
                
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                    {driver ? 'Edit Driver' : 'Register New Driver'}
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Full Name</label>
                        <input 
                            type="text" 
                            required
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                        />
                    </div>
                    {!driver && (
                        <>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Email Address</label>
                                <input 
                                    type="email" 
                                    required
                                    className="input-field"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Password</label>
                                <input 
                                    type="password" 
                                    required
                                    className="input-field"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Vehicle Type</label>
                        <select 
                            className="input-field"
                            value={formData.vehicleType}
                            onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                        >
                            <option value="tricycle">Tricycle</option>
                            <option value="motorcycle">Motorcycle</option>
                            <option value="multicab">Multicab</option>
                            <option value="truck">Truck</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Plate Number</label>
                        <input 
                            type="text" 
                            required
                            className="input-field"
                            value={formData.plateNo}
                            onChange={(e) => setFormData({...formData, plateNo: e.target.value})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.75rem', background: 'var(--accent-indigo)', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
                        {driver ? 'Update Driver' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DriverModal;
