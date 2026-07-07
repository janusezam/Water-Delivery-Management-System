import React, { useState, useEffect } from 'react';
import { X, Link2, User } from 'lucide-react';

const CustomerModal = ({ isOpen, onClose, onSave, customer = null }) => {
    const [formData, setFormData] = useState(customer || {
        name: '',
        phone: '',
        addresses: [{ street: '', barangay: '', city: 'Cebu City', isDefault: true }],
        jugBalance: 0
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(customer || {
                name: '',
                phone: '',
                addresses: [{ street: '', barangay: '', city: 'Cebu City', isDefault: true }],
                jugBalance: 0
            });
        }
    }, [isOpen, customer]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content" style={{
                background: 'var(--surface-bg)',
                padding: '2rem',
                borderRadius: '1.5rem',
                width: '90vw',
                maxWidth: '500px',
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={24} />
                </button>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>
                        {customer ? 'Edit Customer' : 'Add New Customer'}
                    </h3>
                    {customer?.user && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ECFDF5', color: '#059669', padding: '0.35rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '600' }}>
                            <Link2 size={14} />
                            Linked to User Account
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Full Name</label>
                        <input 
                            type="text" 
                            required
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Juan Dela Cruz"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                        />
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>Phone Number (Contact Info)</label>
                        </div>
                        <input 
                            type="text" 
                            required
                            className="input-field"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            placeholder="09123456789"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                        />
                    </div>
                    
                    <div style={{ padding: '1rem', background: 'var(--page-bg)', borderRadius: '1rem', border: '1px solid var(--border-light)' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Address Details</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <input 
                                type="text" 
                                placeholder="Street / House No."
                                value={formData.addresses[0].street}
                                onChange={(e) => {
                                    const newAddrs = [...formData.addresses];
                                    newAddrs[0].street = e.target.value;
                                    setFormData({...formData, addresses: newAddrs});
                                }}
                                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                            />
                            <input 
                                type="text" 
                                placeholder="Barangay"
                                value={formData.addresses[0].barangay}
                                onChange={(e) => {
                                    const newAddrs = [...formData.addresses];
                                    newAddrs[0].barangay = e.target.value;
                                    setFormData({...formData, addresses: newAddrs});
                                }}
                                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Initial Jug Balance (Owed)</label>
                        <input 
                            type="number" 
                            className="input-field"
                            value={formData.jugBalance}
                            onChange={(e) => setFormData({...formData, jugBalance: parseInt(e.target.value)})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '1rem', borderRadius: '0.75rem', background: 'var(--accent-indigo)', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
                        {customer ? 'Update Profile' : 'Register Customer'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CustomerModal;
