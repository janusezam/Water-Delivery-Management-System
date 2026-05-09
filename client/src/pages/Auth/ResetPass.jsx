import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const ResetPass = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { email, otp } = location.state || {};

    const handleReset = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage('Passwords do not match.');
            return;
        }
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/reset-password`, { email, otp, password });
            setMessage('Password reset successful! Redirecting...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            setMessage('Error resetting password. Please try again.');
        }
    };

    if (!email || !otp) {
        return (
            <div className="auth-container">
                <div className="auth-card glass" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Invalid Access</h2>
                    <button className="btn-primary" onClick={() => navigate('/login')}>Return to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card glass">
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ 
                        display: 'inline-flex', 
                        padding: '1.25rem', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        borderRadius: '1.25rem', 
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <ShieldCheck size={32} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '0.5rem', color: 'white' }}>Reset Password</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Create a strong new password</p>
                </div>

                {message && (
                    <div style={{ 
                        background: message.includes('successful') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                        border: `1px solid ${message.includes('successful') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                        color: message.includes('successful') ? '#10b981' : '#ef4444', 
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        textAlign: 'center', 
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem'
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleReset}>
                    <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-secondary)' }} size={20} />
                        <input 
                            type="password" 
                            className="input-field" 
                            placeholder="New Password" 
                            style={{ paddingLeft: '3rem' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-secondary)' }} size={20} />
                        <input 
                            type="password" 
                            className="input-field" 
                            placeholder="Confirm New Password" 
                            style={{ paddingLeft: '3rem' }}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ 
                        width: '100%', 
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                    }}>
                        Reset Password <ArrowRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPass;
