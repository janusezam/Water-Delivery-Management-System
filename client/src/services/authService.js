import { axiosClient } from './axios';

export const login = (email, password, recaptchaToken) => {
  return axiosClient.post('/api/auth/login', { email, password, recaptchaToken });
};

export const adminLogin = (email, password, recaptchaToken) => {
  return axiosClient.post('/api/auth/admin/login', { email, password, recaptchaToken });
};

export const register = (userData) => {
  return axiosClient.post('/api/auth/register', userData);
};

export const verifyActivation = (email, otp) => {
  return axiosClient.post('/api/auth/verify-activation', { email, otp });
};

export const resendOTP = (email) => {
  return axiosClient.post('/api/auth/resend-otp', { email });
};

export const googleLogin = (tokenId, accessToken, role) => {
  return axiosClient.post('/api/auth/google', { tokenId, accessToken, role });
};

export const forgotPassword = (email) => {
  return axiosClient.post('/api/auth/forgot-password', { email });
};

export const verifyOTP = (email, otp) => {
  return axiosClient.post('/api/auth/verify-otp', { email, otp });
};

export const resetPassword = (email, otp, password) => {
  return axiosClient.post('/api/auth/reset-password', { email, otp, password });
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
