import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Lock, Mail, ArrowRight, ChevronLeft } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { adminLogin } from '../../services';


const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { executeRecaptcha } = useGoogleReCaptcha();
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!executeRecaptcha) {
            setMessage('ReCAPTCHA not initialized');
            return;
        }

        try {
            const token = await executeRecaptcha('admin_login');
            const { data } = await adminLogin(email, password, token);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            navigate('/dashboard/admin');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Admin login failed');
        }
    };

    return (
        <div className="admin-login-container" style={{ 
            display: 'flex', 
            minHeight: '100vh', 
            width: '100%', 
            justifyContent: 'center', 
            alignItems: 'center', 
            background: 'var(--page-bg)',
            padding: '2rem'
        }}>
            <style dangerouslySetInnerHTML={{__html: `
                .admin-card {
                    background: var(--surface-bg);
                    padding: 3rem;
                    border-radius: 1.5rem;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                    width: 100%;
                    max-width: 450px;
                }
                .admin-input {
                    width: 100%;
                    padding: 0.875rem 1rem 0.875rem 3rem;
                    border-radius: 0.75rem;
                    border: 1px solid var(--border-medium);
                    outline: none;
                    font-size: 1rem;
                    color: var(--text-main);
                    background: var(--input-bg);
                    transition: all 0.2s;
                }
                .admin-input:focus {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
                    background: var(--input-bg);
                }
                .admin-btn {
                    width: 100%;
                    padding: 0.875rem;
                    background: linear-gradient(135deg, #ef4444, #b91c1c);
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
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
                }
                .admin-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3);
                }
                @media (max-width: 768px) {
                    .admin-card {
                        padding: 2rem;
                    }
                }
            `}} />

            <div className="admin-card">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ 
                        display: 'inline-flex', 
                        padding: '1.25rem', 
                        background: 'linear-gradient(135deg, #ef4444, #b91c1c)', 
                        borderRadius: '50%', 
                        marginBottom: '1.25rem',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }}>
                        <ShieldCheck size={48} color="white" />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, fontFamily: "'Outfit', sans-serif", color: 'var(--text-main)' }}>Admin Portal</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>System Management & Administration</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                    <ShieldAlert size={20} color="#ef4444" />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Secure Login</h2>
                </div>

                {message && (
                    <div style={{ 
                        background: 'var(--badge-red-bg)', 
                        border: '1px solid #fecaca',
                        color: '#ef4444', 
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        textAlign: 'center', 
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem'
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: '600', marginBottom: '0.5rem' }}>Admin Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-light)' }} size={20} />
                            <input 
                                type="email" 
                                className="admin-input" 
                                placeholder="admin@system.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: '600', marginBottom: '0.5rem' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-light)' }} size={20} />
                            <input 
                                type="password" 
                                className="admin-input" 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="admin-btn">
                        Access System <ArrowRight size={20} />
                    </button>
                </form>

                <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                    <Link to="/login" style={{ 
                        color: 'var(--text-light)', 
                        textDecoration: 'none', 
                        fontSize: '0.9rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'color 0.3s ease',
                        fontWeight: '500'
                    }} onMouseOver={(e) => e.target.style.color = 'var(--text-muted)'} onMouseOut={(e) => e.target.style.color = 'var(--text-light)'}>
                        <ChevronLeft size={16} /> Return to Main Site
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;

