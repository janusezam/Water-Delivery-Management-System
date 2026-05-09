import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, ArrowRight, ChevronLeft } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { adminLogin } from '../../services';
import logo from '../../assets/WATERLOGO.png';


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
        <div className="auth-container" style={{ background: 'radial-gradient(circle at top left, #450a0a, #0b0f1a, #0b0f1a)' }}>
            <div className="auth-card glass" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ 
                        display: 'inline-flex', 
                        padding: '0.5rem', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        borderRadius: '1.25rem', 
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        width: '80px',
                        height: '80px',
                        overflow: 'hidden'
                    }}>
                        <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '0.5rem', color: '#fca5a5' }}>Admin Portal</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Authorized access only</p>
                </div>

                {message && (
                    <div style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.2)',
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
                    <div style={{ position: 'relative' }}>
                        <Mail style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-secondary)' }} size={20} />
                        <input 
                            type="email" 
                            className="input-field" 
                            placeholder="Admin Email" 
                            style={{ paddingLeft: '3rem' }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-secondary)' }} size={20} />
                        <input 
                            type="password" 
                            className="input-field" 
                            placeholder="Admin Password" 
                            style={{ paddingLeft: '3rem' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ 
                        width: '100%', 
                        background: 'linear-gradient(135deg, #ef4444, #b91c1c)', 
                        boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)' 
                    }}>
                        Secure Login <ArrowRight size={20} />
                    </button>
                </form>

                <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                    <Link to="/login" style={{ 
                        color: 'var(--text-secondary)', 
                        textDecoration: 'none', 
                        fontSize: '0.9rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'color 0.3s ease'
                    }} onMouseOver={(e) => e.target.style.color = 'white'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
                        <ChevronLeft size={16} /> Return to Main Site
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;

