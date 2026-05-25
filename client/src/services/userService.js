import { axiosClient } from './axios';

export const getUsers = () => {
  return axiosClient.get('/api/users');
};

export const updateUser = (id, userData) => {
  return axiosClient.put(`/api/users/${id}`, userData);
};

export const deleteUser = (id) => {
  return axiosClient.delete(`/api/users/${id}`);
};

export const getMyProfile = () => {
  return axiosClient.get('/api/users/profile');
};

export const updateMyProfile = (data) => {
  return axiosClient.put('/api/users/profile', data);
};
