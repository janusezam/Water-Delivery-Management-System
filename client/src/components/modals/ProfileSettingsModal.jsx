import React, { useState, useEffect } from 'react';
import { X, User, Shield, Mail, Phone, Save, Eye, EyeOff, CheckCircle, AlertCircle, Loader, MapPin, Navigation } from 'lucide-react';
import { getMyProfile, updateMyProfile } from '../../services';
import toast from 'react-hot-toast';

const ProfileSettingsModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);

    // Profile form
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [address, setAddress] = useState({
        street: '',
        barangay: '',
        city: 'Cebu City',
        lat: null,
        lng: null
    });
    const [gettingLocation, setGettingLocation] = useState(false);

    // Password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
        }
    }, [isOpen]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data } = await getMyProfile();
            setProfile(data);
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setMobileNumber(data.mobileNumber || '');
            setAddress(data.address || { street: '', barangay: '', city: 'Cebu City', lat: null, lng: null });
        } catch (error) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await updateMyProfile({ firstName, lastName, mobileNumber, address });
            setProfile(data);
            // Update localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.name = data.name;
            user.firstName = data.firstName;
            user.lastName = data.lastName;
            user.mobileNumber = data.mobileNumber;
            user.address = data.address;
            localStorage.setItem('user', JSON.stringify(user));
            
            // Dispatch custom event to notify other components (e.g. Header)
            window.dispatchEvent(new Event('userUpdate'));

            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Use OpenStreetMap Nominatim API for reverse geocoding
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    
                    if (data && data.address) {
                        const street = data.address.road || data.address.street || data.address.suburb || '';
                        const barangay = data.address.village || data.address.neighbourhood || data.address.suburb || '';
                        const city = data.address.city || data.address.town || data.address.county || 'Cebu City';
                        
                        setAddress({
                            street,
                            barangay,
                            city,
                            lat: latitude,
                            lng: longitude
                        });
                        toast.success('Location found successfully!');
                    } else {
                        toast.error('Could not determine address from location');
                    }
                } catch (error) {
                    console.error('Error fetching address:', error);
                    toast.error('Failed to get address from location');
                } finally {
                    setGettingLocation(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                toast.error('Failed to get location. Please ensure location permissions are granted.');
                setGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setSaving(true);
        try {
            await updateMyProfile({ currentPassword, newPassword });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Password changed successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const inputStyle = {
        width: '100%',
        padding: '0.75rem 1rem 0.75rem 2.75rem',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-medium)',
        outline: 'none',
        fontSize: '0.925rem',
        color: 'var(--text-main)',
        background: 'var(--input-bg)',
        transition: 'all 0.2s ease',
        fontFamily: 'Inter, sans-serif'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        fontWeight: '600',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes backdropFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .profile-modal-overlay {
                    animation: backdropFadeIn 0.2s ease-out;
                }
                .profile-modal-card {
                    animation: modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .profile-tab-btn {
                    position: relative;
                    background: transparent;
                    border: none;
                    padding: 0.75rem 1.25rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    color: var(--text-muted);
                    transition: all 0.2s ease;
                    border-radius: 0.625rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-family: 'Inter', sans-serif;
                }
                .profile-tab-btn:hover {
                    color: var(--text-main);
                    background: var(--surface-hover);
                }
                .profile-tab-btn.active {
                    color: #4F46E5;
                    background: var(--active-bg);
                }
                .profile-settings-input:focus {
                    border-color: #4F46E5 !important;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
                }
                .profile-save-btn {
                    background: linear-gradient(135deg, #4F46E5, #3730A3);
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
                    font-family: 'Inter', sans-serif;
                }
                .profile-save-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35);
                }
                .profile-save-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
                .pass-toggle-btn {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: var(--text-light);
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    transition: color 0.2s;
                }
                .pass-toggle-btn:hover {
                    color: var(--text-muted);
                }
            `}} />

            {/* Overlay */}
            <div className="profile-modal-overlay" onClick={onClose} style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 9999,
                display: 'grid',
                placeItems: 'center',
                padding: '2rem'
            }}>
                {/* Modal Card */}
                <div className="profile-modal-card" onClick={e => e.stopPropagation()} style={{
                    background: 'var(--surface-bg)',
                    borderRadius: '1.25rem',
                    width: '90vw',
                    maxWidth: '560px',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '1.5rem 1.75rem',
                        borderBottom: '1px solid var(--border-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, fontFamily: "'Outfit', sans-serif" }}>Account Settings</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage your profile and security</p>
                        </div>
                        <button onClick={onClose} style={{
                            background: 'var(--surface-hover)',
                            border: 'none',
                            borderRadius: '0.625rem',
                            width: '36px',
                            height: '36px',
                            display: 'grid',
                            placeItems: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            transition: 'all 0.2s'
                        }}>
                            <X size={18} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        padding: '0.75rem 1.75rem',
                        borderBottom: '1px solid var(--border-light)',
                    }}>
                        <button
                            className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <User size={16} /> Profile
                        </button>
                        {profile && (
                            <button
                                className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                                onClick={() => setActiveTab('security')}
                            >
                                <Shield size={16} /> Security
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }} className="modal-content">
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem', gap: '0.75rem', color: 'var(--text-muted)' }}>
                                <Loader size={20} className="animate-spin" />
                                <span>Loading profile...</span>
                            </div>
                        ) : activeTab === 'profile' ? (
                            <form onSubmit={handleSaveProfile}>
                                {/* Profile Header */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1.25rem',
                                    marginBottom: '2rem',
                                    padding: '1.25rem',
                                    background: 'var(--active-bg)',
                                    borderRadius: '1rem',
                                    border: '1px solid var(--border-light)'
                                }}>
                                    {profile.profilePicture ? (
                                        <img
                                            src={profile.profilePicture}
                                            alt="Profile"
                                            style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '3px solid white',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #4F46E5, #3730A3)',
                                            color: 'white',
                                            display: 'grid',
                                            placeItems: 'center',
                                            fontWeight: '700',
                                            fontSize: '1.25rem',
                                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                                        }}>
                                            {profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??'}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>{profile.name || 'No Name'}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{profile.email}</div>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: '600',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '999px',
                                                background: '#EEF2FF',
                                                color: '#4F46E5',
                                                textTransform: 'capitalize'
                                            }}>{profile.role}</span>
                                            {profile.isGoogleUser && (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: '600',
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '999px',
                                                    background: '#ECFDF5',
                                                    color: '#059669',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                                    Google Linked
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* First Name & Last Name */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                    <div>
                                        <label style={labelStyle}>First Name</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={e => setFirstName(e.target.value)}
                                                className="profile-settings-input"
                                                style={inputStyle}
                                                placeholder="First name"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Last Name</label>
                                        <div style={{ position: 'relative' }}>
                                            <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={e => setLastName(e.target.value)}
                                                className="profile-settings-input"
                                                style={inputStyle}
                                                placeholder="Last name"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Email (read-only) */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={labelStyle}>Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            style={{ ...inputStyle, background: 'var(--input-disabled-bg)', cursor: 'not-allowed', opacity: 0.7 }}
                                        />
                                    </div>
                                </div>

                                {/* Mobile Number */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={labelStyle}>Mobile Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                        <input
                                            type="tel"
                                            value={mobileNumber}
                                            onChange={e => setMobileNumber(e.target.value)}
                                            className="profile-settings-input"
                                            style={inputStyle}
                                            placeholder="09xxxxxxxxx"
                                        />
                                    </div>
                                </div>

                                {/* Home Address */}
                                {profile.role !== 'admin' && (
                                    <div style={{ marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <label style={{ ...labelStyle, marginBottom: 0 }}>Home Address</label>
                                            <button 
                                                type="button" 
                                                onClick={handleGetLocation}
                                                disabled={gettingLocation}
                                                style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '0.35rem', 
                                                    background: 'var(--surface-hover)', 
                                                    border: 'none', 
                                                    padding: '0.4rem 0.75rem', 
                                                    borderRadius: '2rem', 
                                                    fontSize: '0.75rem', 
                                                    fontWeight: '600', 
                                                    color: '#4F46E5',
                                                    cursor: gettingLocation ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {gettingLocation ? <Loader size={12} className="animate-spin" /> : <Navigation size={12} />}
                                                Use My Exact Location
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'var(--page-bg)', borderRadius: '1rem', border: '1px solid var(--border-light)' }}>
                                            <div style={{ position: 'relative' }}>
                                                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                                <input
                                                    type="text"
                                                    value={address.street}
                                                    onChange={e => setAddress({ ...address, street: e.target.value })}
                                                    className="profile-settings-input"
                                                    style={inputStyle}
                                                    placeholder="Street / House No."
                                                />
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                                <input
                                                    type="text"
                                                    value={address.barangay}
                                                    onChange={e => setAddress({ ...address, barangay: e.target.value })}
                                                    className="profile-settings-input"
                                                    style={inputStyle}
                                                    placeholder="Barangay"
                                                />
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                                <input
                                                    type="text"
                                                    value={address.city}
                                                    onChange={e => setAddress({ ...address, city: e.target.value })}
                                                    className="profile-settings-input"
                                                    style={inputStyle}
                                                    placeholder="City"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}


                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="profile-save-btn" disabled={saving}>
                                        {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* Security Tab */
                            <form onSubmit={handleChangePassword}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '1rem 1.25rem',
                                    background: 'var(--badge-yellow-bg)',
                                    borderRadius: '0.75rem',
                                    marginBottom: '2rem',
                                    border: '1px solid var(--border-light)'
                                }}>
                                    <AlertCircle size={20} color="#D97706" />
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Choose a strong password with at least 6 characters. You'll need your current password to make changes.
                                    </div>
                                </div>

                                {/* Current Password */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={labelStyle}>Current Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                        <input
                                            type={showCurrentPass ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={e => setCurrentPassword(e.target.value)}
                                            className="profile-settings-input"
                                            style={inputStyle}
                                            placeholder="Enter current password"
                                            required
                                        />
                                        <button type="button" className="pass-toggle-btn" onClick={() => setShowCurrentPass(!showCurrentPass)}>
                                            {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={labelStyle}>New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                        <input
                                            type={showNewPass ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className="profile-settings-input"
                                            style={inputStyle}
                                            placeholder="Enter new password"
                                            required
                                        />
                                        <button type="button" className="pass-toggle-btn" onClick={() => setShowNewPass(!showNewPass)}>
                                            {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <label style={labelStyle}>Confirm New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                        <input
                                            type={showConfirmPass ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            className="profile-settings-input"
                                            style={inputStyle}
                                            placeholder="Confirm new password"
                                            required
                                        />
                                        <button type="button" className="pass-toggle-btn" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                                            {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <div style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <AlertCircle size={12} /> Passwords do not match
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="profile-save-btn" disabled={saving}>
                                        {saving ? <Loader size={16} className="animate-spin" /> : <Shield size={16} />}
                                        {saving ? 'Changing...' : 'Change Password'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfileSettingsModal;
