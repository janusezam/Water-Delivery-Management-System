import { axiosClient } from './axios';

export const getExpenses = () => {
  return axiosClient.get('/api/expenses');
};

export const getExpenseById = (id) => {
  return axiosClient.get(`/api/expenses/${id}`);
};

export const createExpense = (expenseData) => {
  return axiosClient.post('/api/expenses', expenseData);
};

export const updateExpense = (id, expenseData) => {
  return axiosClient.put(`/api/expenses/${id}`, expenseData);
};

export const deleteExpense = (id) => {
  return axiosClient.delete(`/api/expenses/${id}`);
};
