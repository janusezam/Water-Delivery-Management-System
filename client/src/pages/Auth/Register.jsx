import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User as UserIcon, Briefcase, Truck } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { register } from '../../services';
import logo from '../../assets/WATERLOGO.png';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const { executeRecaptcha } = useGoogleReCaptcha();
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!executeRecaptcha) {
            setMessage('ReCAPTCHA not initialized');
            return;
        }

        try {
            const token = await executeRecaptcha('register');
            await register({ name, email, password, role, recaptchaToken: token });
            setMessage('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Registration failed');
        }
    };

    const roles = [
        { id: 'user', icon: <UserIcon size={18} />, label: 'Customer' },
        { id: 'staff', icon: <Briefcase size={18} />, label: 'Staff' },
        { id: 'driver', icon: <Truck size={18} />, label: 'Driver' }
    ];

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
                    background: white;
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
                    background: white;
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
                .login-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
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
                        padding: 4rem 2rem;
                        flex: none;
                    }
                    .login-right-pane {
                        padding: 2rem 1rem;
                        align-items: flex-start;
                    }
                    .login-card {
                        padding: 2rem;
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
                    <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>Create Account</h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>Join the AquaDeliver network today</p>

                    {message && (
                        <div style={{ 
                            background: message.includes('successful') ? '#ecfdf5' : '#fef2f2', 
                            border: `1px solid ${message.includes('successful') ? '#a7f3d0' : '#fecaca'}`,
                            color: message.includes('successful') ? '#059669' : '#ef4444', 
                            padding: '0.75rem',
                            borderRadius: '0.75rem',
                            textAlign: 'center', 
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem'
                        }}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: '600', marginBottom: '0.5rem' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <UserIcon style={{ position: 'absolute', top: '14px', left: '14px', color: '#94a3b8' }} size={20} />
                                <input 
                                    type="text" 
                                    className="login-input" 
                                    placeholder="Full Name" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: '600', marginBottom: '0.5rem' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail style={{ position: 'absolute', top: '14px', left: '14px', color: '#94a3b8' }} size={20} />
                                <input 
                                    type="email" 
                                    className="login-input" 
                                    placeholder="your@email.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: '600', marginBottom: '0.5rem' }}>Password</label>
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
                            <label style={{ display: 'block', marginBottom: '0.75rem', color: '#334155', fontSize: '0.85rem', fontWeight: '600' }}>
                                Account Type
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                                {roles.map((r) => (
                                    <div 
                                        key={r.id}
                                        onClick={() => setRole(r.id)}
                                        style={{
                                            padding: '0.75rem 0.5rem',
                                            textAlign: 'center',
                                            borderRadius: '0.75rem',
                                            cursor: 'pointer',
                                            border: `1px solid ${role === r.id ? 'var(--accent-blue)' : '#e2e8f0'}`,
                                            background: role === r.id ? '#eff6ff' : '#f8fafc',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: role === r.id ? 'var(--accent-blue)' : '#64748b'
                                        }}
                                    >
                                        <div style={{ color: role === r.id ? 'var(--accent-blue)' : '#94a3b8' }}>
                                            {r.icon}
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{r.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="login-btn">
                            Register Now <ArrowRight size={20} />
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.95rem' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '700', marginLeft: '0.5rem' }}>Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

