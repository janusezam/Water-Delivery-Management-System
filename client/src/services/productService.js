import { axiosClient } from './axios';

export const getProducts = () => {
  return axiosClient.get('/api/products');
};

export const getProductById = (id) => {
  return axiosClient.get(`/api/products/${id}`);
};

export const createProduct = (productData) => {
  return axiosClient.post('/api/products', productData);
};

export const updateProduct = (id, productData) => {
  return axiosClient.put(`/api/products/${id}`, productData);
};

export const deleteProduct = (id) => {
  return axiosClient.delete(`/api/products/${id}`);
};
