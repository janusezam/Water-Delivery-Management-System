import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, ArrowLeft, ArrowRight, KeyRound, Droplet, Truck, MapPin } from 'lucide-react';
import axios from 'axios';
import logo from '../../assets/WATERLOGO.png';

const ForgotPass = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: OTP
    const [message, setMessage] = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const [otpExpiry, setOtpExpiry] = useState(60); // 1 minute
    const navigate = useNavigate();

    React.useEffect(() => {
        let interval;
        if (step === 2) {
            interval = setInterval(() => {
                if (resendTimer > 0) setResendTimer((prev) => prev - 1);
                if (otpExpiry > 0) setOtpExpiry((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step, resendTimer, otpExpiry]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`, { email });
            setStep(2);
            setMessage('OTP sent to your email.');
            setResendTimer(60);
            setOtpExpiry(60);
        } catch (error) {
            setMessage('Error sending OTP. Please try again.');
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/verify-otp`, { email, otp });
            navigate('/reset-password', { state: { email, otp } });
        } catch (error) {
            setMessage('Invalid or expired OTP.');
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
                    background: #f8fafc;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 2rem;
                }
                .login-card {
                    background: var(--surface-bg);
                    padding: 3rem;
                    border-radius: 1.5rem;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
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
                .otp-input {
                    letter-spacing: 0.8rem;
                    text-align: center;
                    font-weight: 800;
                    font-size: 1.25rem;
                    padding-left: 3rem !important;
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
                    <Link to="/login" style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        color: '#64748b', 
                        textDecoration: 'none', 
                        marginBottom: '2rem', 
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        transition: 'color 0.2s ease'
                    }} onMouseOver={(e) => e.target.style.color = 'var(--accent-blue)'} onMouseOut={(e) => e.target.style.color = '#64748b'}>
                        <ArrowLeft size={16} /> Back to Login
                    </Link>

                    <h2 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>
                        {step === 1 ? 'Forgot Password' : 'Verify OTP'}
                    </h2>
                    
                    {step === 2 && (
                        <div style={{ 
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            background: '#fef2f2',
                            color: '#ef4444',
                            borderRadius: '2rem',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            marginBottom: '1.5rem',
                            textAlign: 'center',
                            width: 'fit-content',
                            margin: '0 auto 1.5rem'
                        }}>
                            {otpExpiry > 0 ? `Expires in: ${formatTime(otpExpiry)}` : 'Code Expired'}
                        </div>
                    )}

                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>
                        {step === 1 ? 'Enter your email to receive a reset code' : 'Enter the 6-digit code sent to your email'}
                    </p>

                    {message && (
                        <div style={{ 
                            background: message.toLowerCase().includes('sent') ? '#ecfdf5' : '#fef2f2', 
                            border: `1px solid ${message.toLowerCase().includes('sent') ? '#a7f3d0' : '#fecaca'}`,
                            color: message.toLowerCase().includes('sent') ? '#059669' : '#ef4444', 
                            padding: '0.75rem',
                            borderRadius: '0.75rem',
                            textAlign: 'center', 
                            marginBottom: '1.5rem',
                            fontSize: '0.9rem'
                        }}>
                            {message}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSendOTP}>
                            <div style={{ marginBottom: '1.5rem' }}>
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
                            <button type="submit" className="login-btn">
                                Send Reset Code <ArrowRight size={20} />
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#334155', fontWeight: '600', marginBottom: '0.5rem' }}>6-Digit Code</label>
                                <div style={{ position: 'relative' }}>
                                    <ShieldCheck style={{ position: 'absolute', top: '14px', left: '14px', color: '#94a3b8' }} size={20} />
                                    <input 
                                        type="text" 
                                        className="login-input otp-input" 
                                        placeholder="000000" 
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={6}
                                        disabled={otpExpiry === 0}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="login-btn" disabled={otpExpiry === 0}>
                                Verify Code <ArrowRight size={20} />
                            </button>
                            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                <button 
                                    type="button" 
                                    onClick={handleSendOTP}
                                    disabled={resendTimer > 0}
                                    style={{ background: 'none', border: 'none', color: resendTimer > 0 ? '#94a3b8' : 'var(--accent-blue)', cursor: resendTimer > 0 ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                                >
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPass;
