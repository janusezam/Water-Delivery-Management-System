import React from 'react';
import { Navigate } from 'react-router-dom';
import Unauthorized from '../../pages/Auth/Unauthorized';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Render the 403 Unauthorized component instead of redirecting
        return <Unauthorized />;
    }

    return children;
};

export default ProtectedRoute;