import { axiosClient } from './axios';

export const getTrips = async (params = {}) => {
  return axiosClient.get('/api/trip-sales', { params });
};

export const getMyActiveTrip = async () => {
  return axiosClient.get('/api/trip-sales/my-active');
};

export const getTripById = async (id) => {
  return axiosClient.get(`/api/trip-sales/${id}`);
};

export const createTrip = async (data) => {
  return axiosClient.post('/api/trip-sales', data);
};

export const recordSale = async (id, data) => {
  return axiosClient.post(`/api/trip-sales/${id}/sell`, data);
};

export const endTrip = async (id) => {
  return axiosClient.put(`/api/trip-sales/${id}/end`);
};

export const completeTrip = async (id, data) => {
  return axiosClient.put(`/api/trip-sales/${id}/complete`, data);
};

export const cancelTrip = async (id) => {
  return axiosClient.put(`/api/trip-sales/${id}/cancel`);
};
