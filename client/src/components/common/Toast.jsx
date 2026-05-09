import React from 'react';
import { AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';

const Toast = ({ show, message, type = 'success', onClose }) => {
    if (!show) return null;

    const colors = {
        success: { bg: '#10B981', icon: <CheckCircle2 size={20} /> },
        error: { bg: '#EF4444', icon: <XCircle size={20} /> },
        warning: { bg: '#F59E0B', icon: <AlertCircle size={20} /> },
        info: { bg: '#3B82F6', icon: <Info size={20} /> }
    };

    const config = colors[type] || colors.success;

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: config.bg,
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '1rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 9999,
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '300px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '0.75rem' }}>
                {config.icon}
                <span style={{ fontSize: '0.925rem' }}>{message}</span>
            </div>
            
            <button 
                onClick={onClose}
                style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                }}
            >
                ✕
            </button>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(120%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Toast;
