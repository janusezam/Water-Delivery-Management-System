import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their respective dashboard if they try to access unauthorized URL
        const dashboardMap = {
            admin: '/dashboard/admin',
            staff: '/dashboard/staff',
            driver: '/dashboard/driver',
            user: '/dashboard/user'
        };
        return <Navigate to={dashboardMap[user.role] || '/login'} replace />;
    }

    return children;
};

export default ProtectedRoute;