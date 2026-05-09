import { axiosClient } from './axios';

export const getDrivers = () => {
  return axiosClient.get('/api/drivers');
};

export const getDriverById = (id) => {
  return axiosClient.get(`/api/drivers/${id}`);
};

export const createDriver = (driverData) => {
  return axiosClient.post('/api/drivers', driverData);
};

export const updateDriver = (id, driverData) => {
  return axiosClient.put(`/api/drivers/${id}`, driverData);
};

export const deleteDriver = (id) => {
  return axiosClient.delete(`/api/drivers/${id}`);
};
