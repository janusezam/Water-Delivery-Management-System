import { axiosClient } from './axios';

export const getWalkIns = () => {
  return axiosClient.get('/api/walkin');
};

export const getWalkInById = (id) => {
  return axiosClient.get(`/api/walkin/${id}`);
};

export const createWalkIn = (walkInData) => {
  return axiosClient.post('/api/walkin', walkInData);
};

export const updateWalkIn = (id, walkInData) => {
  return axiosClient.put(`/api/walkin/${id}`, walkInData);
};

export const deleteWalkIn = (id) => {
  return axiosClient.delete(`/api/walkin/${id}`);
};
