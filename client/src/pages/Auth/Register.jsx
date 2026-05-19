import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User as UserIcon, Phone, Droplet, Truck, MapPin } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { register } from '../../services';
import logo from '../../assets/WATERLOGO.png';

const Register = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { executeRecaptcha } = useGoogleReCaptcha();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }
        
        if (!executeRecaptcha) {
            setMessage('ReCAPTCHA not initialized');
            return;
        }

        setLoading(true);
        try {
            const token = await executeRecaptcha('register');
            const response = await register({ 
                firstName, 
                lastName, 
                email, 
                mobileNumber, 
                password, 
                recaptchaToken: token 
            });
            
            setMessage(response.data.message || 'Registration successful!');
            
            if (response.data.requiresActivation || response.status === 201) {
                // Save email to localStorage for the verification page
                localStorage.setItem('verify_email', email);
                setTimeout(() => navigate('/verify-activation'), 2000);
            }
        } catch (error) {
            if (error.response?.data?.requiresActivation) {
                localStorage.setItem('verify_email', email);
                setMessage(error.response.data.message);
                setTimeout(() => navigate('/verify-activation'), 2000);
            } else {
                setMessage(error.response?.data?.message || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

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
                    padding: 2.5rem;
                    border-radius: 1.5rem;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                    width: 100%;
                    max-width: 500px;
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
                    margin-top: 1rem;
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
                .grid-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-bottom: 1.25rem;
                }
                @media (max-width: 768px) {
                    .login-split-container {
                        flex-direction: column;
                    }
                    .login-left-pane {
                        padding: 3rem 2rem;
                        flex: none;
                    }
                    .icon-grid {
                        gap: 1.5rem;
                    }
                    .login-right-pane {
                        padding: 1.5rem 1rem;
                        align-items: flex-start;
                    }
                    .login-card {
                        padding: 2rem;
                    }
                    .grid-row {
                        grid-template-columns: 1fr;
                    }
                }
            `}} />

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
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>Create Account</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Start your journey with us today</p>

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

                    <form onSubmit={handleSubmit}>
                        <div className="grid-row">
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: '600', marginBottom: '0.5rem' }}>First Name</label>
                                <div style={{ position: 'relative' }}>
                                    <UserIcon style={{ position: 'absolute', top: '14px', left: '14px', color: '#94a3b8' }} size={20} />
                                    <input 
                                        type="text" 
                                        className="login-input" 
                                        placeholder="First Name" 
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: '600', marginBottom: '0.5rem' }}>Last Name</label>
                                <div style={{ position: 'relative' }}>
                                    <UserIcon style={{ position: 'absolute', top: '14px', left: '14px', color: '#94a3b8' }} size={20} />
                                    <input 
                                        type="text" 
                                        className="login-input" 
                                        placeholder="Last Name" 
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>
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

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: '600', marginBottom: '0.5rem' }}>Mobile Number</label>
                            <div style={{ position: 'relative' }}>
                                <Phone style={{ position: 'absolute', top: '14px', left: '14px', color: '#94a3b8' }} size={20} />
                                <input 
                                    type="tel" 
                                    className="login-input" 
                                    placeholder="09XXXXXXXXX" 
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid-row">
                            <div>
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
                            <div>
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
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Register Now'} {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '700', marginLeft: '0.5rem' }}>Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

