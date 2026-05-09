import { axiosClient } from './axios';

export const getCustomers = () => {
  return axiosClient.get('/api/customers');
};

export const getCustomerById = (id) => {
  return axiosClient.get(`/api/customers/${id}`);
};

export const createCustomer = (customerData) => {
  return axiosClient.post('/api/customers', customerData);
};

export const updateCustomer = (id, customerData) => {
  return axiosClient.put(`/api/customers/${id}`, customerData);
};

export const deleteCustomer = (id) => {
  return axiosClient.delete(`/api/customers/${id}`);
};
