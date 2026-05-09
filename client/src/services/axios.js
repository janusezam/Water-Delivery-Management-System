import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const axiosClient = axios.create({
  baseURL: apiUrl,
});

// Add axios interceptor for JWT token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
