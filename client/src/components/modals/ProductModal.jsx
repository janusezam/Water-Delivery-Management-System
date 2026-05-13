import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, onSave, product = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'slim',
        pricePerUnit: 0,
        stockQty: 0,
        containerDeposit: 0
    });
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Sync formData when product prop changes (for editing)
    useEffect(() => {
        if (product) {
            setFormData(product);
            setPreviewUrl(product.imageUrl);
        } else {
            setFormData({
                name: '',
                type: 'slim',
                pricePerUnit: 0,
                stockQty: 0,
                containerDeposit: 0
            });
            setPreviewUrl(null);
        }
        setImageFile(null); // Reset file selection
    }, [product, isOpen]);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData, imageFile);
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
                width: '450px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={24} />
                </button>
                
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                    {product ? 'Edit Product' : 'Add New Product'}
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Image Upload Section */}
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <div style={{ 
                            width: '120px', 
                            height: '120px', 
                            background: 'var(--page-bg)', 
                            borderRadius: '1rem', 
                            margin: '0 auto 1rem',
                            overflow: 'hidden',
                            display: 'grid',
                            placeItems: 'center',
                            border: '2px dashed var(--border-light)',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'border-color 0.2s'
                        }} onClick={() => document.getElementById('productImage').click()}>
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>Click to upload</div>
                            )}
                        </div>
                        <input 
                            type="file" 
                            id="productImage" 
                            hidden 
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Product Name</label>
                        <input 
                            type="text" required
                            placeholder="e.g. 5-Gallon Slim Refill"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Type</label>
                        <select 
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                        >
                            <option value="slim">Slim (5-Gallon)</option>
                            <option value="round">Round (5-Gallon)</option>
                            <option value="gallon">Small Gallon</option>
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Price (₱)</label>
                            <input 
                                type="number" required
                                value={formData.pricePerUnit}
                                onChange={(e) => setFormData({...formData, pricePerUnit: parseFloat(e.target.value)})}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Stock</label>
                            <input 
                                type="number" required
                                value={formData.stockQty}
                                onChange={(e) => setFormData({...formData, stockQty: parseInt(e.target.value)})}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Container Deposit (₱)</label>
                        <input 
                            type="number"
                            value={formData.containerDeposit}
                            onChange={(e) => setFormData({...formData, containerDeposit: parseFloat(e.target.value)})}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', outline: 'none', color: 'var(--text-main)', background: 'var(--input-bg)' }}
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.75rem', background: 'var(--accent-indigo)', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                        {product ? 'Update Product' : 'Save Product'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
