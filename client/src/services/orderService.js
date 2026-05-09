import { axiosClient } from './axios';

export const getOrders = () => {
  return axiosClient.get('/api/orders');
};

export const getOrderById = (id) => {
  return axiosClient.get(`/api/orders/${id}`);
};

export const createOrder = (orderData) => {
  return axiosClient.post('/api/orders', orderData);
};

export const updateOrder = (id, orderData) => {
  return axiosClient.put(`/api/orders/${id}`, orderData);
};

export const updateOrderStatus = (id, status) => {
  return axiosClient.patch(`/api/orders/${id}/status`, { status });
};

export const deleteOrder = (id) => {
  return axiosClient.delete(`/api/orders/${id}`);
};
