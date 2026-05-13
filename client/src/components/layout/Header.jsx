import React, { useState, useEffect } from 'react';
import { Bell, Search, ChevronRight, Moon, Sun } from 'lucide-react';

const Header = ({ breadcrumbs = [] }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';

    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check local storage or system preference on load
        const savedMode = localStorage.getItem('theme');
        if (savedMode === 'dark' || (!savedMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDarkMode(true);
            document.body.classList.add('dark-mode');
        }
    }, []);

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

    return (
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

            {/* Right Section: Notifications & Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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

                <div style={{ position: 'relative', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Bell size={20} />
                    <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%', border: '2px solid var(--surface-bg)' }}></span>
                </div>

                <div style={{ height: '24px', width: '1px', background: 'var(--border-light)' }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)' }}>{user.name || 'Admin'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role || 'Super Admin'}</div>
                    </div>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: 'linear-gradient(135deg, #4F46E5, #3730A3)', 
                        color: 'white', 
                        borderRadius: '0.75rem', 
                        display: 'grid', 
                        placeItems: 'center', 
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)'
                    }}>
                        {initials}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
