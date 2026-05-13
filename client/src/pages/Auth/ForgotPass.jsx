import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, ArrowLeft, ArrowRight, KeyRound } from 'lucide-react';
import axios from 'axios';
import logo from '../../assets/WATERLOGO.png';

const ForgotPass = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: OTP
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`, { email });
            setStep(2);
            setMessage('OTP sent to your email.');
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
                .otp-input {
                    letter-spacing: 0.5rem;
                    text-align: center;
                    font-weight: 800;
                    font-size: 1.25rem;
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
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>
                        {step === 1 ? 'Enter your email to receive a reset code' : 'Enter the 6-digit code sent to your email'}
                    </p>

                    {message && (
                        <div style={{ 
                            background: step === 2 && message.includes('sent') ? '#ecfdf5' : '#fef2f2', 
                            border: `1px solid ${step === 2 && message.includes('sent') ? '#a7f3d0' : '#fecaca'}`,
                            color: step === 2 && message.includes('sent') ? '#059669' : '#ef4444', 
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
                                        placeholder="0 0 0 0 0 0" 
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={6}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="login-btn">
                                Verify Code <ArrowRight size={20} />
                            </button>
                            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setStep(1)}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                                >
                                    Resend Code
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
