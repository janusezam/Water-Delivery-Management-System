import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { verifyActivation, resendOTP } from '../../services';
import logo from '../../assets/WATERLOGO.png';

const VerifyOTP = () => {
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [otpExpiry, setOtpExpiry] = useState(60); // 1 minute in seconds
    const navigate = useNavigate();

    useEffect(() => {
        const storedEmail = localStorage.getItem('verify_email');
        if (!storedEmail) {
            navigate('/register');
        } else {
            setEmail(storedEmail);
        }
    }, [navigate]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (resendTimer > 0) setResendTimer((prev) => prev - 1);
            if (otpExpiry > 0) setOtpExpiry((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer, otpExpiry]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (otpExpiry === 0) {
            setMessage('OTP has expired. Please request a new one.');
            return;
        }

        if (otp.length !== 6) {
            setMessage('Please enter a 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await verifyActivation(email, otp);
            setMessage(response.data.message || 'Account activated successfully!');
            localStorage.removeItem('verify_email');
            
            // Log the user in automatically
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify({
                _id: response.data._id,
                name: response.data.name,
                email: response.data.email,
                role: response.data.role
            }));

            setTimeout(() => navigate('/'), 2000);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;

        setResending(true);
        try {
            const response = await resendOTP(email);
            setMessage(response.data.message || 'OTP resent successfully!');
            setResendTimer(60); // 60 seconds cooldown for button
            setOtpExpiry(60); // Reset expiry timer
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResending(false);
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
                    text-align: center;
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
                    background: #ffffff;
                }
                .otp-input {
                    letter-spacing: 0.8rem;
                    text-align: center;
                    font-weight: 800;
                    font-size: 1.25rem;
                    padding-left: 3rem !important;
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
                    margin-top: 1.5rem;
                }
                .login-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
                }
                .login-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .resend-btn {
                    background: none;
                    border: none;
                    color: var(--accent-blue);
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    margin: 0 auto;
                    transition: all 0.2s;
                }
                .resend-btn:disabled {
                    color: #94a3b8;
                    cursor: not-allowed;
                }
                .timer-badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    background: #fef2f2;
                    color: #ef4444;
                    border-radius: 2rem;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
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

            <div className="login-left-pane">
                <img src={logo} alt="Logo" className="brand-logo" />
                <h1 style={{ fontSize: '3rem', fontWeight: '800', margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em', textShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>AquaDeliver</h1>
                <p style={{ fontSize: '1.25rem', opacity: 0.9, marginTop: '0.75rem', fontWeight: '500', letterSpacing: '0.05em' }}>A Water Refilling Station Delivery Management System</p>
            </div>

            <div className="login-right-pane">
                <div className="login-card">
                    {otpExpiry > 0 ? (
                        <div className="timer-badge">
                            Expires in: {formatTime(otpExpiry)}
                        </div>
                    ) : (
                        <div className="timer-badge" style={{ background: '#fef2f2', color: '#ef4444' }}>
                            Code Expired
                        </div>
                    )}
                    
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>Enter OTP</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>Please enter the code within the time limit</p>

                    {message && (
                        <div style={{ 
                            background: message.toLowerCase().includes('success') ? '#ecfdf5' : '#fef2f2', 
                            border: `1px solid ${message.toLowerCase().includes('success') ? '#a7f3d0' : '#fecaca'}`,
                            color: message.toLowerCase().includes('success') ? '#059669' : '#ef4444', 
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
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <ShieldCheck style={{ position: 'absolute', top: '14px', left: '14px', color: '#94a3b8' }} size={20} />
                                <input
                                    type="text"
                                    className="login-input otp-input"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    disabled={otpExpiry === 0}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading || otpExpiry === 0}>
                            {loading ? 'Verifying...' : 'Verify & Activate'} {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem' }}>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Didn't receive the code?</p>
                        <button 
                            className="resend-btn" 
                            onClick={handleResend} 
                            disabled={resending || resendTimer > 0}
                        >
                            <RefreshCw size={16} className={resending ? 'spin' : ''} />
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                        </button>
                    </div>

                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                        <Link to="/register" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
                            Entered wrong email? <span style={{ color: 'var(--accent-blue)', fontWeight: '700' }}>Register again</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;
