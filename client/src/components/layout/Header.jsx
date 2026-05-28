import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Moon, Sun, Settings, LogOut, ChevronDown, Check, CheckCheck, Trash2, Package, Truck, MapPin, Fuel, ShoppingCart, AlertTriangle, X } from 'lucide-react';
import ProfileSettingsModal from '../modals/ProfileSettingsModal';
import { getMyProfile } from '../../services';
import { useNotifications } from '../../context/NotificationContext';

const Header = ({ breadcrumbs = [] }) => {
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';
    const navigate = useNavigate();

    const [isDarkMode, setIsDarkMode] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);

    const {
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        markAsRead,
        markAllAsRead,
        loadMore
    } = useNotifications();

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
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        if (dropdownOpen || notifOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen, notifOpen]);

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

    // Get icon for notification type
    const getNotifIcon = (type) => {
        const iconMap = {
            order_created: <ShoppingCart size={16} />,
            order_status: <Package size={16} />,
            order_assigned: <Truck size={16} />,
            order_cancelled: <X size={16} />,
            delivery_completed: <Check size={16} />,
            delivery_failed: <AlertTriangle size={16} />,
            trip_created: <MapPin size={16} />,
            trip_assigned: <MapPin size={16} />,
            trip_ended: <MapPin size={16} />,
            trip_completed: <Check size={16} />,
            trip_cancelled: <X size={16} />,
            low_stock: <AlertTriangle size={16} />,
            expense_logged: <Fuel size={16} />
        };
        return iconMap[type] || <Bell size={16} />;
    };

    // Get color accent for notification type
    const getNotifColor = (type) => {
        if (['delivery_completed', 'trip_completed'].includes(type)) return '#10B981';
        if (['delivery_failed', 'low_stock'].includes(type)) return '#F59E0B';
        if (['order_cancelled', 'trip_cancelled'].includes(type)) return '#EF4444';
        if (['order_assigned', 'trip_assigned', 'trip_created'].includes(type)) return '#6366F1';
        if (['order_created'].includes(type)) return '#3B82F6';
        if (['expense_logged'].includes(type)) return '#8B5CF6';
        return '#6B7280';
    };

    // Time ago helper
    const timeAgo = (dateStr) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (diffSec < 60) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHr < 24) return `${diffHr}h ago`;
        if (diffDay < 7) return `${diffDay}d ago`;
        return date.toLocaleDateString();
    };

    // Handle notification click — navigate to relevant page based on role and entity
    const handleNotifClick = (notif) => {
        if (!notif.isRead) {
            markAsRead(notif._id);
        }

        const userRole = user?.role;

        // Navigate based on related model and user role
        if (notif.relatedModel === 'Order') {
            if (userRole === 'driver') {
                navigate('/dashboard/driver');
            } else {
                navigate('/orders');
            }
        } else if (notif.relatedModel === 'TripSale') {
            if (userRole === 'driver') {
                navigate('/dashboard/driver');
            } else {
                navigate('/trip-sales');
            }
        } else if (notif.relatedModel === 'Product') {
            navigate('/products');
        } else if (notif.relatedModel === 'GasExpense') {
            navigate('/expenses');
        }

        setNotifOpen(false);
    };

    // Scroll handler for infinite scroll in notifications
    const handleNotifScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !isLoading) {
            loadMore();
        }
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes dropdownSlideIn {
                    from { opacity: 0; transform: translateY(-8px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes bellShake {
                    0%, 100% { transform: rotate(0deg); }
                    15% { transform: rotate(14deg); }
                    30% { transform: rotate(-12deg); }
                    45% { transform: rotate(10deg); }
                    60% { transform: rotate(-8deg); }
                    75% { transform: rotate(4deg); }
                }
                @keyframes badgePulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
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
                .profile-dropdown, .notif-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    background: var(--modal-bg);
                    border-radius: 1rem;
                    box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--border-light);
                    z-index: 200;
                    animation: dropdownSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }
                .profile-dropdown {
                    width: 300px;
                }
                .notif-dropdown {
                    width: 400px;
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
                .notif-bell-btn {
                    position: relative;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.5rem;
                    border-radius: 0.625rem;
                    transition: all 0.2s ease;
                }
                .notif-bell-btn:hover {
                    background: var(--surface-hover);
                    color: var(--text-main);
                }
                .notif-bell-btn.active {
                    background: var(--active-bg);
                    color: #4F46E5;
                }
                .notif-bell-btn.has-unread .bell-icon {
                    animation: bellShake 0.6s ease-in-out;
                }
                .notif-badge {
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    min-width: 18px;
                    height: 18px;
                    background: linear-gradient(135deg, #EF4444, #DC2626);
                    color: white;
                    border-radius: 999px;
                    font-size: 0.65rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 4px;
                    border: 2px solid var(--surface-bg);
                    animation: badgePulse 2s ease-in-out infinite;
                    line-height: 1;
                }
                .notif-item {
                    display: flex;
                    gap: 0.75rem;
                    padding: 0.875rem 1rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    border-bottom: 1px solid var(--border-light);
                    position: relative;
                }
                .notif-item:hover {
                    background: var(--surface-hover);
                }
                .notif-item.unread {
                    background: var(--active-bg, rgba(79, 70, 229, 0.04));
                }
                .notif-item.unread::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background: #4F46E5;
                    border-radius: 0 2px 2px 0;
                }
                .notif-icon-wrap {
                    width: 36px;
                    height: 36px;
                    border-radius: 0.625rem;
                    display: grid;
                    place-items: center;
                    flex-shrink: 0;
                }
                .notif-list::-webkit-scrollbar {
                    width: 5px;
                }
                .notif-list::-webkit-scrollbar-track {
                    background: transparent;
                }
                .notif-list::-webkit-scrollbar-thumb {
                    background: var(--border-light);
                    border-radius: 10px;
                }
                .notif-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem 1rem;
                    color: var(--text-muted);
                    gap: 0.75rem;
                }
                .notif-empty svg {
                    opacity: 0.3;
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
                zIndex: 1010,
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

                    {/* Notifications Bell */}
                    <div ref={notifRef} style={{ position: 'relative' }}>
                        <button
                            className={`notif-bell-btn ${notifOpen ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}
                            onClick={() => {
                                setNotifOpen(!notifOpen);
                                setDropdownOpen(false);
                            }}
                            title="Notifications"
                            id="notification-bell"
                        >
                            <Bell size={20} className="bell-icon" />
                            {unreadCount > 0 && (
                                <span className="notif-badge">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {notifOpen && (
                            <div className="notif-dropdown">
                                {/* Header */}
                                <div style={{
                                    padding: '1rem 1.25rem',
                                    borderBottom: '1px solid var(--border-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                            Notifications
                                        </span>
                                        {unreadCount > 0 && (
                                            <span style={{
                                                background: 'linear-gradient(135deg, #4F46E5, #3730A3)',
                                                color: 'white',
                                                fontSize: '0.65rem',
                                                fontWeight: '700',
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: '999px'
                                            }}>
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAllAsRead();
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#4F46E5',
                                                fontSize: '0.78rem',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.375rem',
                                                transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = 'var(--active-bg)'}
                                            onMouseLeave={(e) => e.target.style.background = 'none'}
                                            title="Mark all as read"
                                        >
                                            <CheckCheck size={14} />
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                {/* Notification List */}
                                <div
                                    className="notif-list"
                                    style={{
                                        maxHeight: '420px',
                                        overflowY: 'auto',
                                        overflowX: 'hidden'
                                    }}
                                    onScroll={handleNotifScroll}
                                >
                                    {notifications.length === 0 ? (
                                        <div className="notif-empty">
                                            <Bell size={40} />
                                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>No notifications yet</span>
                                            <span style={{ fontSize: '0.8rem' }}>We'll notify you when something happens</span>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => {
                                            const color = getNotifColor(notif.type);
                                            return (
                                                <div
                                                    key={notif._id}
                                                    className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                                                    onClick={() => handleNotifClick(notif)}
                                                >
                                                    <div
                                                        className="notif-icon-wrap"
                                                        style={{ background: `${color}15`, color }}
                                                    >
                                                        {getNotifIcon(notif.type)}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontSize: '0.83rem',
                                                            fontWeight: notif.isRead ? '500' : '650',
                                                            color: 'var(--text-main)',
                                                            marginBottom: '0.2rem',
                                                            lineHeight: 1.3
                                                        }}>
                                                            {notif.title}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.78rem',
                                                            color: 'var(--text-muted)',
                                                            lineHeight: 1.4,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {notif.message}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.7rem',
                                                            color: notif.isRead ? 'var(--text-muted)' : '#4F46E5',
                                                            fontWeight: notif.isRead ? '400' : '600',
                                                            marginTop: '0.3rem'
                                                        }}>
                                                            {timeAgo(notif.createdAt)}
                                                        </div>
                                                    </div>
                                                    {!notif.isRead && (
                                                        <div style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            background: '#4F46E5',
                                                            flexShrink: 0,
                                                            marginTop: '0.4rem'
                                                        }} />
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                    {isLoading && (
                                        <div style={{
                                            padding: '1rem',
                                            textAlign: 'center',
                                            color: 'var(--text-muted)',
                                            fontSize: '0.8rem'
                                        }}>
                                            Loading...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ height: '24px', width: '1px', background: 'var(--border-light)' }}></div>

                    {/* Profile Trigger + Dropdown */}
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <div
                            className={`header-profile-trigger ${dropdownOpen ? 'active' : ''}`}
                            onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
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
