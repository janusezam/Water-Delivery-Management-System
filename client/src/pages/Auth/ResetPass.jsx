import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import logo from '../../assets/WATERLOGO.png';

const ResetPass = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { email, otp } = location.state || {};

    const handleReset = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/reset-password`, { email, otp, password });
            setMessage('Password reset successful! Redirecting...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error resetting password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!email || !otp) {
        return (
            <div className="login-split-container" style={{ display: 'flex', minHeight: '100vh', width: '100%', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
                <div style={{ textAlign: 'center', background: 'white', padding: '3rem', borderRadius: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Invalid Access</h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>You must request a reset code first.</p>
                    <button className="login-btn" onClick={() => navigate('/forgot-password')} style={{ width: '100%', padding: '0.875rem', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '0.75rem', cursor: 'pointer' }}>
                        Return to Forgot Password
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-split-container" style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
            <style dangerouslySetInnerHTML={{__html: `
                .login-split-container {
                    flex-direction: row;
                }
                .login-left-pane {
                    flex: 1;
                    background: linear-gradient(135deg, var(--accent-blue), #0047a5);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    padding: 2rem;
                }
                .login-right-pane {
                    flex: 1;
                    background: #f8fafc;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 2rem;
                }
                .login-card {
                    background: var(--input-bg);
                    padding: 3rem;
                    border-radius: 1.5rem;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                    width: 100%;
                    max-width: 450px;
                }
                .login-input {
                    width: 100%;
                    padding: 0.875rem 1rem 0.875rem 3rem;
                    border-radius: 0.75rem;
                    border: 1px solid #e2e8f0;
                    outline: none;
                    font-size: 1rem;
                    color: #1e293b;
                    background: #f8fafc;
                    transition: all 0.2s;
                }
                .login-input:focus {
                    border-color: var(--accent-blue);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    background: var(--input-bg);
                }
                .login-btn {
                    width: 100%;
                    padding: 0.875rem;
                    background: var(--accent-blue);
                    color: white;
                    border: none;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 0.5rem;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
                }
                .login-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
                }
                .login-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .brand-logo {
                    width: 200px;
                    height: 200px;
                    object-fit: contain;
                    margin-bottom: 2rem;
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));
                }
                .brand-logo:hover {
                    transform: scale(1.1) translateY(-10px);
                    filter: drop-shadow(0 20px 30px rgba(0,0,0,0.3));
                }
                @media (max-width: 768px) {
                    .login-split-container {
                        flex-direction: column;
                    }
                    .login-left-pane {
                        padding: 3rem 2rem;
                        flex: none;
                    }
                    .login-right-pane {
                        padding: 2rem 1rem;
                    }
                }
            `}} />

            {/* Left Side */}
            <div className="login-left-pane">
                <img src={logo} alt="Logo" className="brand-logo" />
                <h1 style={{ fontSize: '3rem', fontWeight: '800', margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em', textShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>AquaDeliver</h1>
                <p style={{ fontSize: '1.25rem', opacity: 0.9, marginTop: '0.75rem', fontWeight: '500', letterSpacing: '0.05em' }}>A Water Refilling Station Delivery Management System</p>
            </div>

            {/* Right Side */}
            <div className="login-right-pane">
                <div className="login-card">
                    <Link to="/forgot-password" style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        color: '#64748b', 
                        textDecoration: 'none', 
                        marginBottom: '2rem', 
                        fontSize: '0.85rem',
                        fontWeight: '600'
                    }}>
                        <ArrowLeft size={16} /> Back
                    </Link>

                    <div style={{ display: 'inline-flex', padding: '1rem', background: '#ecfdf5', borderRadius: '1rem', marginBottom: '1.5rem', color: '#10b981' }}>
                        <ShieldCheck size={32} />
                    </div>

                    <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>Reset Password</h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>Create a strong new password for your account</p>

                    {message && (
                        <div style={{ 
                            background: message.toLowerCase().includes('successful') ? '#ecfdf5' : '#fef2f2', 
                            border: `1px solid ${message.toLowerCase().includes('successful') ? '#a7f3d0' : '#fecaca'}`,
                            color: message.toLowerCase().includes('successful') ? '#059669' : '#ef4444', 
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
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: '600', marginBottom: '0.5rem' }}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock style={{ position: 'absolute', top: '14px', left: '14px', color: '#94a3b8' }} size={20} />
                                <input
                                    type="password"
                                    className="login-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: '600', marginBottom: '0.5rem' }}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock style={{ position: 'absolute', top: '14px', left: '14px', color: '#94a3b8' }} size={20} />
                                <input
                                    type="password"
                                    className="login-input"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Updating...' : 'Reset Password'} {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPass;
