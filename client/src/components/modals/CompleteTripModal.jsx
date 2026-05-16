import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';

const CompleteTripModal = ({ isOpen, onClose, onSave, trip }) => {
    const [formData, setFormData] = useState({
        endKm: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen && trip) {
            setFormData({
                endKm: '',
                notes: ''
            });
        }
    }, [isOpen, trip]);

    if (!isOpen || !trip) return null;

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
                background: 'var(--surface-bg)',
                padding: '2rem',
                borderRadius: '1.5rem',
                width: '400px',
                position: 'relative',
                border: '1px solid var(--border-light)'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={24} />
                </button>
                
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={24} color="var(--success-green)" />
                    Complete Trip
                </h3>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--page-bg)', borderRadius: '0.75rem', border: '1px solid var(--border-light)' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Driver: <strong style={{ color: 'var(--text-main)' }}>{trip.driver?.user?.name}</strong></p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Started at: <strong style={{ color: 'var(--text-main)' }}>{new Date(trip.startTime).toLocaleString()}</strong></p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Start Odometer: <strong style={{ color: 'var(--text-main)' }}>{trip.startKm} km</strong></p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Ending Odometer (Km)</label>
                        <input 
                            type="number" 
                            required
                            min={trip.startKm || 0}
                            className="input-field"
                            value={formData.endKm}
                            onChange={(e) => setFormData({...formData, endKm: e.target.value})}
                            placeholder="Must be greater than start km"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--page-bg)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Notes (Optional)</label>
                        <textarea 
                            className="input-field"
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            placeholder="Any issues or comments?"
                            rows="3"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--page-bg)', resize: 'none' }}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ 
                            marginTop: '0.5rem', 
                            padding: '1rem', 
                            borderRadius: '0.75rem', 
                            background: 'var(--success-green)', 
                            color: 'white', 
                            fontWeight: '800', 
                            border: 'none', 
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        Mark as Completed
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompleteTripModal;
