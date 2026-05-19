import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Truck, Droplet, MapPin } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
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
            if (error.response?.status === 403 && error.response?.data?.requiresActivation) {
                localStorage.setItem('verify_email', error.response.data.email);
                setMessage('Account not activated. Redirecting to verification...');
                setTimeout(() => navigate('/verify-activation'), 1500);
            } else {
                setMessage(error.response?.data?.message || 'Login failed');
            }
        }
    };

    const handleGoogleSuccess = async (authResponse) => {
        try {
            // authResponse can be from standard GoogleLogin or custom useGoogleLogin
            const tokenId = authResponse.credential; // from standard
            const accessToken = authResponse.access_token; // from custom

            const { data } = await googleLogin(tokenId, accessToken);
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

    const login = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => setMessage('Google Login Failed'),
    });

    return (
        <div className="login-split-container" style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
            <style dangerouslySetInnerHTML={{__html: `
                .login-split-container {
                    flex-direction: row;
                }
                @keyframes cardSlideIn {
                    from { opacity: 0; transform: translateX(40px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .login-left-pane {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                    background: linear-gradient(135deg, var(--accent-blue), #0047a5);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    padding: 2rem;
                    z-index: 1;
                }
                .login-left-pane::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.4) 0%, transparent 40%),
                                radial-gradient(circle at 80% 60%, rgba(37, 99, 235, 0.4) 0%, transparent 50%);
                    z-index: -1;
                }
                .login-right-pane {
                    flex: 1;
                    background: var(--page-bg);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 2rem;
                }
                .login-card {
                    background: var(--surface-bg);
                    padding: 3rem;
                    border-radius: 1.5rem;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25); /* Increased shadow */
                    width: 100%;
                    max-width: 450px;
                    animation: cardSlideIn 0.4s ease-out forwards;
                }
                .login-input {
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
                    margin-bottom: 1.5rem;
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
                }
                .brand-logo:hover {
                    transform: scale(1.1) translateY(-10px);
                    filter: drop-shadow(0 20px 30px rgba(0,0,0,0.4));
                }
                .icon-grid {
                    display: flex;
                    gap: 3rem;
                    margin-top: 3rem;
                }
                .icon-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    text-align: center;
                }
                .icon-wrapper {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.05);
                    transition: all 0.3s ease;
                }
                .icon-item:hover .icon-wrapper {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateY(-3px);
                }
                .icon-title {
                    font-size: 0.85rem;
                    font-weight: 600;
                    letter-spacing: 0.02em;
                    color: rgba(255, 255, 255, 0.9);
                }
                .divider {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    width: 60%;
                    margin: 2rem 0;
                    opacity: 0.5;
                }
                .divider-line {
                    height: 1px;
                    flex: 1;
                    background: linear-gradient(90deg, transparent, white, transparent);
                }
                .divider-dot {
                    width: 6px;
                    height: 6px;
                    background: white;
                    border-radius: 50%;
                }
                .wave-bottom {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 15vh;
                    z-index: -1;
                }
                @media (max-width: 768px) {
                    .login-split-container {
                        flex-direction: column;
                    }
                    .login-left-pane {
                        padding: 4rem 2rem;
                        flex: none;
                    }
                    .icon-grid {
                        gap: 1.5rem;
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
                {/* Decorative waves */}
                <svg className="wave-bottom" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path fill="#0047a5" fillOpacity="0.6" d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,213,720,208C840,203,960,171,1080,165.3C1200,160,1320,181,1380,192L1440,203L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
                    <path fill="#000000" fillOpacity="0.1" d="M0,96L80,117.3C160,139,320,181,480,186.7C640,192,800,160,960,149.3C1120,139,1280,149,1360,154.7L1440,160L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
                </svg>

                <img src={logo} alt="Logo" className="brand-logo" />
                
                <h1 style={{ fontSize: '3.5rem', fontWeight: '800', margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em', textShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>AquaDeliver</h1>
                <p style={{ fontSize: '1.25rem', opacity: 0.9, marginTop: '1rem', fontWeight: '400', letterSpacing: '0.02em', textAlign: 'center', maxWidth: '80%' }}>
                    A Water Refilling Station Delivery Management System
                </p>

                <div className="divider">
                    <div className="divider-line"></div>
                    <div className="divider-dot"></div>
                    <div className="divider-line"></div>
                </div>

                <div className="icon-grid">
                    <div className="icon-item">
                        <div className="icon-wrapper">
                            <Droplet size={24} color="white" />
                        </div>
                        <span className="icon-title">Quality Water</span>
                    </div>
                    <div className="icon-item">
                        <div className="icon-wrapper">
                            <Truck size={24} color="white" />
                        </div>
                        <span className="icon-title">Fast Delivery</span>
                    </div>
                    <div className="icon-item">
                        <div className="icon-wrapper">
                            <MapPin size={24} color="white" />
                        </div>
                        <span className="icon-title">Order Tracking</span>
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <div className="login-right-pane">
                <div className="login-card">
                    <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>Sign in to System</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>Enter your credentials to continue</p>

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
                            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: '600', marginBottom: '0.5rem' }}>Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-light)' }} size={20} />
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
                            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: '600', marginBottom: '0.5rem' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock style={{ position: 'absolute', top: '14px', left: '14px', color: 'var(--text-light)' }} size={20} />
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
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600' }}>OR CONTINUE WITH</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button 
                            onClick={() => login()}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                background: '#ffffff',
                                border: '1px solid #3b82f6',
                                borderRadius: '2rem',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: '700',
                                color: '#1e293b',
                                fontSize: '0.9rem',
                                letterSpacing: '0.02em',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = '#f8fafc';
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.15)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = '#ffffff';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            LOG IN WITH GOOGLE
                        </button>
                    </div>

                    <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Don't have an account? <Link to="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '700', marginLeft: '0.5rem' }}>Register now</Link>
                    </div>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <Link to="/admin/login" style={{ 
                            color: 'var(--text-light)', 
                            fontSize: '0.85rem', 
                            textDecoration: 'none',
                            transition: 'color 0.2s ease',
                            fontWeight: '500'
                        }} onMouseOver={(e) => e.target.style.color = 'var(--text-muted)'} onMouseOut={(e) => e.target.style.color = 'var(--text-light)'}>
                            Admin Portal
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;


