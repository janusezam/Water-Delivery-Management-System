import React from 'react';
import { Bell, Search, ChevronRight } from 'lucide-react';

const Header = ({ breadcrumbs = [] }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';

    return (
        <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 2rem',
            background: 'white',
            borderBottom: '1px solid #E5E7EB',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            animation: 'fadeIn 0.3s ease-out'
        }}>
            {/* Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280', fontSize: '0.85rem', fontWeight: '500' }}>
                <span style={{ color: '#111827', fontWeight: '700', textTransform: 'capitalize' }}>{user.role || 'Admin'}</span>
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
                <div style={{ position: 'relative', color: '#6B7280', cursor: 'pointer' }}>
                    <Bell size={20} />
                    <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%', border: '2px solid white' }}></span>
                </div>

                <div style={{ height: '24px', width: '1px', background: '#E5E7EB' }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#111827' }}>{user.name || 'Admin'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'capitalize' }}>{user.role || 'Super Admin'}</div>
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
