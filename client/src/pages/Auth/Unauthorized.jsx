import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <h1 className="text-9xl font-bold text-red-500 mb-4">403</h1>
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">Unauthorized Access</h2>
            <p className="text-gray-600 mb-8 text-center max-w-md">
                You do not have the required permissions to view this page. If you believe this is an error, please contact the system administrator.
            </p>
            <button 
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
                Go Back
            </button>
        </div>
    );
};

export default Unauthorized;
