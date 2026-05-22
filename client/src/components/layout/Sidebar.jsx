import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../../assets/WATERLOGO.png';

import {
    LayoutDashboard,
    ShoppingBag,
    Truck,
    Users,
    Package,
    Map as MapIcon,
    ShoppingCart,
    CreditCard,
    BarChart3,
    LogOut,
    Droplets,
    Settings,
    Navigation,
    ChevronLeft,
    ChevronRight,
    History
} from 'lucide-react';

const Sidebar = ({ role }) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved === 'true' ? true : false;
    });

    // Get role from localStorage to ensure the correct links are shown
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role || role || 'staff';

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', newState);
    };

    const adminLinks = [
        { path: '/dashboard/admin', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
        { path: '/users', icon: <Users size={22} />, label: 'Users' },
        { path: '/walkin', icon: <ShoppingBag size={22} />, label: 'Walk-In Sales' },
        { path: '/orders', icon: <Truck size={22} />, label: 'Orders' },
        { path: '/customers', icon: <Users size={22} />, label: 'Customers' },
        { path: '/products', icon: <Package size={22} />, label: 'Products' },
        { path: '/drivers', icon: <Users size={22} />, label: 'Drivers' },
        { path: '/live-map', icon: <MapIcon size={22} />, label: 'Live Map' },
        { path: '/expenses', icon: <CreditCard size={22} />, label: 'Gas Expenses' },
        { path: '/reports', icon: <BarChart3 size={22} />, label: 'Reports' },
    ];

    const staffLinks = [
        { path: '/dashboard/staff', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
        { path: '/walkin', icon: <ShoppingBag size={22} />, label: 'Walk-In Sales' },
        { path: '/orders', icon: <Truck size={22} />, label: 'Orders' },
        { path: '/customers', icon: <Users size={22} />, label: 'Customers' },
        { path: '/products', icon: <Package size={22} />, label: 'Products' },
        { path: '/live-map', icon: <MapIcon size={22} />, label: 'Live Map' },
    ];

    const driverLinks = [
        { path: '/dashboard/driver', icon: <Truck size={22} />, label: 'My Deliveries' },
        { path: '/delivery-history', icon: <History size={22} />, label: 'Delivery History' },
        { path: '/route', icon: <Navigation size={22} />, label: 'Active Route' },
        { path: '/expenses', icon: <CreditCard size={22} />, label: 'Gas Expenses' },
    ];

    const customerLinks = [
        { path: '/dashboard/user', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
        { path: '/products', icon: <Package size={22} />, label: 'Products' },
        { path: '/cart', icon: <ShoppingCart size={22} />, label: 'Shopping Cart' },
        { path: '/orders', icon: <Truck size={22} />, label: 'My Orders' },
    ];

    const getLinks = () => {
        if (userRole === 'admin') return adminLinks;
        if (userRole === 'driver') return driverLinks;
        if (userRole === 'user') return customerLinks;
        return staffLinks;
    };

    const links = getLinks();

    return (
        <aside className="sidebar" style={{
            width: isCollapsed ? '88px' : '280px',
            background: 'var(--surface-bg)',
            borderRight: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            position: 'sticky',
            top: 0,
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 100,
            padding: 0 // Explicitly override global padding
        }}>
            {/* Logo Section */}
            <div style={{
                padding: isCollapsed ? '2rem 0' : '2.5rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '0.875rem',
                position: 'relative',
                overflow: 'visible', // Allow title to breathe
                transition: 'all 0.3s ease'
            }}>
                <div style={{ 
                    flexShrink: 0, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    width: isCollapsed ? '100%' : '50px',
                    height: isCollapsed ? '50px' : '50px',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden'
                }}>
                    <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        backgroundColor: '#4F46E5', 
                        WebkitMaskImage: `url(${logo})`,
                        WebkitMaskSize: 'contain',
                        WebkitMaskPosition: 'center',
                        WebkitMaskRepeat: 'no-repeat',
                        maskImage: `url(${logo})`,
                        maskSize: 'contain',
                        maskPosition: 'center',
                        maskRepeat: 'no-repeat'
                    }} title="AquaDeliver Logo" />
                </div>
                {!isCollapsed && (
                    <h1 style={{
                        fontSize: '1.625rem',
                        fontWeight: '900',
                        color: '#4F46E5',
                        letterSpacing: '-0.04em',
                        whiteSpace: 'nowrap',
                        margin: 0,
                        paddingRight: '1rem', // Extra space for the letter 'R'
                        animation: 'fadeInRight 0.4s ease-out'
                    }}>AquaDeliver</h1>
                )}
            </div>

            {/* Collapse Toggle Button */}
            <button
                onClick={toggleSidebar}
                style={{
                    position: 'absolute',
                    right: '-14px',
                    top: '85px',
                    width: '28px',
                    height: '28px',
                    background: 'var(--surface-bg)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    zIndex: 200,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    transform: isCollapsed ? 'rotate(0deg)' : 'rotate(0deg)'
                }}
            >
                {isCollapsed ? <ChevronRight size={16} color="#4F46E5" /> : <ChevronLeft size={16} color="#4F46E5" />}
            </button>

            {/* Navigation Links - Scrollable */}
            <nav style={{
                padding: isCollapsed ? '0 0.75rem' : '0 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }}>
                {links.map((link, index) => (
                    <NavLink
                        key={index}
                        to={link.path}
                        onClick={(e) => {
                            if (link.onClick) {
                                e.preventDefault();
                                link.onClick();
                            }
                        }}
                        title={isCollapsed ? link.label : ''}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                            gap: isCollapsed ? '0' : '1rem',
                            padding: isCollapsed ? '0.875rem 0' : '0.875rem 1rem',
                            borderRadius: '0.875rem',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            fontWeight: isActive ? '700' : '500',
                            transition: 'all 0.2s ease',
                            color: isActive ? '#4F46E5' : 'var(--text-muted)',
                            background: isActive ? 'var(--active-bg)' : 'transparent',
                            minHeight: '52px',
                            width: '100%',
                            boxShadow: isActive ? '0 2px 4px rgba(79, 70, 229, 0.05)' : 'none'
                        })}
                    >
                        <span style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            flexShrink: 0, 
                            width: isCollapsed ? '32px' : 'auto', 
                            justifyContent: 'center',
                            transition: 'transform 0.2s ease'
                        }} className="sidebar-icon">{link.icon}</span>
                        {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{link.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Logout Section */}
            <div
                onClick={() => navigate('/login')}
                style={{
                    marginTop: 'auto',
                    padding: isCollapsed ? '2rem 0' : '1.5rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: '1rem',
                    color: '#EF4444',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    borderTop: '1px solid var(--border-light)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--active-bg)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <LogOut size={22} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span>Logout</span>}
            </div>
        </aside>
    );
};

export default Sidebar;
