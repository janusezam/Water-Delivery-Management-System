import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Moon, Sun, Settings, LogOut, ChevronDown } from 'lucide-react';
import ProfileSettingsModal from '../modals/ProfileSettingsModal';
import { getMyProfile } from '../../services';

const Header = ({ breadcrumbs = [] }) => {
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';
    const navigate = useNavigate();

    const [isDarkMode, setIsDarkMode] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const savedMode = localStorage.getItem('theme');
        if (savedMode === 'dark' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDarkMode(true);
            document.body.classList.add('dark-mode');
        }
    }, []);

    useEffect(() => {
        const handleUserUpdate = () => {
            setUser(JSON.parse(localStorage.getItem('user') || '{}'));
        };
        window.addEventListener('userUpdate', handleUserUpdate);
        window.addEventListener('storage', handleUserUpdate);

        // Fetch fresh profile data from server on component load to resolve cached/stale localStorage issues
        const syncProfile = async () => {
            try {
                if (localStorage.getItem('token')) {
                    const { data } = await getMyProfile();
                    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                    const updatedUser = { ...storedUser, ...data };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    setUser(updatedUser);
                }
            } catch (error) {
                console.error('Failed to sync profile data from server:', error);
            }
        };
        syncProfile();

        return () => {
            window.removeEventListener('userUpdate', handleUserUpdate);
            window.removeEventListener('storage', handleUserUpdate);
        };
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setDropdownOpen(false);
        navigate('/login');
    };

    const handleOpenSettings = () => {
        setDropdownOpen(false);
        setShowSettings(true);
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes dropdownSlideIn {
                    from { opacity: 0; transform: translateY(-8px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .header-profile-trigger {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    padding: 0.375rem;
                    border-radius: 0.875rem;
                    transition: all 0.2s ease;
                    border: 1px solid transparent;
                    position: relative;
                }
                .header-profile-trigger:hover {
                    background: var(--surface-hover);
                    border-color: var(--border-light);
                }
                .header-profile-trigger.active {
                    background: var(--active-bg);
                    border-color: rgba(79, 70, 229, 0.2);
                }
                .profile-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    width: 300px;
                    background: var(--modal-bg);
                    border-radius: 1rem;
                    box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--border-light);
                    z-index: 200;
                    animation: dropdownSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }
                .dropdown-menu-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1.25rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    border: none;
                    background: transparent;
                    width: 100%;
                    text-align: left;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-main);
                }
                .dropdown-menu-item:hover {
                    background: var(--surface-hover);
                }
                .dropdown-menu-item.danger {
                    color: #EF4444;
                }
                .dropdown-menu-item.danger:hover {
                    background: var(--badge-red-bg);
                }
                .dropdown-icon-wrap {
                    width: 32px;
                    height: 32px;
                    border-radius: 0.5rem;
                    display: grid;
                    place-items: center;
                    flex-shrink: 0;
                }
                .chevron-rotate {
                    transition: transform 0.2s ease;
                }
                .chevron-rotate.open {
                    transform: rotate(180deg);
                }
            `}} />

            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 2rem',
                background: 'var(--surface-bg)',
                borderBottom: '1px solid var(--border-light)',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                animation: 'fadeIn 0.3s ease-out'
            }}>
                {/* Breadcrumbs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: '700', textTransform: 'capitalize' }}>{user.role || 'Admin'}</span>
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                            <ChevronRight size={14} />
                            <span style={{ color: index === breadcrumbs.length - 1 ? '#4F46E5' : '#6B7280', fontWeight: index === breadcrumbs.length - 1 ? '700' : '500' }}>
                                {crumb}
                            </span>
                        </React.Fragment>
                    ))}
                </div>

                {/* Right Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            transition: 'background 0.2s'
                        }}
                        title="Toggle Dark Mode"
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {/* Notifications */}
                    <div style={{ position: 'relative', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <Bell size={20} />
                        <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%', border: '2px solid var(--surface-bg)' }}></span>
                    </div>

                    <div style={{ height: '24px', width: '1px', background: 'var(--border-light)' }}></div>

                    {/* Profile Trigger + Dropdown */}
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <div
                            className={`header-profile-trigger ${dropdownOpen ? 'active' : ''}`}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            id="header-profile-trigger"
                        >
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1.3 }}>{user.name || 'User'}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role || 'User'}</div>
                            </div>
                            {user.profilePicture ? (
                                <img
                                    src={user.profilePicture}
                                    alt="Profile"
                                    referrerPolicy="no-referrer"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '2px solid var(--border-light)',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    background: 'linear-gradient(135deg, #4F46E5, #3730A3)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    display: 'grid',
                                    placeItems: 'center',
                                    fontWeight: '700',
                                    fontSize: '0.9rem',
                                    boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)'
                                }}>
                                    {initials}
                                </div>
                            )}
                            <ChevronDown size={14} color="var(--text-light)" className={`chevron-rotate ${dropdownOpen ? 'open' : ''}`} />
                        </div>

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <div className="profile-dropdown">
                                {/* Dropdown Header */}
                                <div style={{
                                    padding: '1.25rem',
                                    borderBottom: '1px solid var(--border-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.875rem'
                                }}>
                                    {user.profilePicture ? (
                                        <img
                                            src={user.profilePicture}
                                            alt="Profile"
                                            referrerPolicy="no-referrer"
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '2px solid var(--border-light)',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            background: 'linear-gradient(135deg, #4F46E5, #3730A3)',
                                            color: 'white',
                                            borderRadius: '50%',
                                            display: 'grid',
                                            placeItems: 'center',
                                            fontWeight: '700',
                                            fontSize: '1.1rem',
                                            boxShadow: '0 4px 8px rgba(79, 70, 229, 0.2)'
                                        }}>
                                            {initials}
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {user.name || 'User'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
                                            {user.email}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.4rem' }}>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                fontWeight: '600',
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: '999px',
                                                background: 'var(--badge-blue-bg)',
                                                color: '#4F46E5',
                                                textTransform: 'capitalize'
                                            }}>{user.role}</span>
                                            {user.isGoogleUser && (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: '600',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '999px',
                                                    background: 'var(--badge-green-bg)',
                                                    color: '#059669',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.2rem'
                                                }}>
                                                    <svg width="10" height="10" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                                    Google
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div style={{ padding: '0.5rem 0' }}>
                                    <button className="dropdown-menu-item" onClick={handleOpenSettings}>
                                        <div className="dropdown-icon-wrap" style={{ background: 'var(--active-bg)' }}>
                                            <Settings size={16} color="#4F46E5" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>Account Settings</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400', marginTop: '0.1rem' }}>Manage your profile</div>
                                        </div>
                                    </button>
                                </div>

                                {/* Logout */}
                                <div style={{ borderTop: '1px solid var(--border-light)', padding: '0.5rem 0' }}>
                                    <button className="dropdown-menu-item danger" onClick={handleLogout}>
                                        <div className="dropdown-icon-wrap" style={{ background: 'var(--badge-red-bg)' }}>
                                            <LogOut size={16} color="#EF4444" />
                                        </div>
                                        <div style={{ fontWeight: '600' }}>Sign Out</div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Profile Settings Modal */}
            <ProfileSettingsModal
                isOpen={showSettings}
                onClose={() => {
                    setShowSettings(false);
                    // Re-read user from localStorage in case profile was updated
                    window.dispatchEvent(new Event('storage'));
                }}
            />
        </>
    );
};

export default Header;
