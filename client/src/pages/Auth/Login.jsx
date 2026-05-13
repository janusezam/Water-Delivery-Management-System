import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { login, googleLogin } from '../../services';
import logo from '../../assets/WATERLOGO.png';

const Login = () => {
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
            const token = await executeRecaptcha('login');
            const { data } = await login(email, password, token);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));

            if (data.role === 'staff') navigate('/dashboard/staff');
            else if (data.role === 'driver') navigate('/dashboard/driver');
            else if (data.role === 'admin') navigate('/dashboard/admin');
            else navigate('/dashboard/user');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Login failed');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const { data } = await googleLogin(credentialResponse.credential);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));

            if (data.role === 'staff') navigate('/dashboard/staff');
            else if (data.role === 'driver') navigate('/dashboard/driver');
            else if (data.role === 'admin') navigate('/dashboard/admin');
            else navigate('/dashboard/user');
        } catch (error) {
            setMessage('Google login failed');
        }
    };

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
                    <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>Sign in to System</h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>Enter your credentials to continue</p>

                    {message && (
                        <div style={{ 
                            background: '#fef2f2', 
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
                            <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: '600', marginBottom: '0.5rem' }}>Email</label>
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
                            <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
                                <Link to="/forgot-password" style={{ color: 'var(--accent-blue)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '600' }}>
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        <button type="submit" className="login-btn">
                            Sign In <ArrowRight size={20} />
                        </button>
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>OR CONTINUE WITH</span>
                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setMessage('Google Login Failed')}
                            theme="outline"
                            shape="pill"
                            text="signin_with"
                            useOneTap={false}
                        />
                    </div>

                    <div style={{ marginTop: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.95rem' }}>
                        Don't have an account? <Link to="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '700', marginLeft: '0.5rem' }}>Register now</Link>
                    </div>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <Link to="/admin/login" style={{ 
                            color: '#94a3b8', 
                            fontSize: '0.85rem', 
                            textDecoration: 'none',
                            transition: 'color 0.2s ease',
                            fontWeight: '500'
                        }} onMouseOver={(e) => e.target.style.color = '#475569'} onMouseOut={(e) => e.target.style.color = '#94a3b8'}>
                            Admin Portal
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;


