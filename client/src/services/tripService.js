import { axiosClient } from './axios';

export const getTrips = () => {
  return axiosClient.get('/api/trips');
};

export const getTripById = (id) => {
  return axiosClient.get(`/api/trips/${id}`);
};

export const createTrip = (tripData) => {
  return axiosClient.post('/api/trips', tripData);
};

export const updateTrip = (id, tripData) => {
  return axiosClient.put(`/api/trips/${id}`, tripData);
};

export const updateTripStatus = (id, status) => {
  return axiosClient.patch(`/api/trips/${id}/status`, { status });
};

export const deleteTrip = (id) => {
  return axiosClient.delete(`/api/trips/${id}`);
};

export const completeTrip = (id, data) => {
  return axiosClient.put(`/api/trips/${id}/complete`, data);
};
