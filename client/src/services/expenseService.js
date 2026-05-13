import { axiosClient } from './axios';

export const getExpenses = (params) => {
  return axiosClient.get('/api/expenses', { params });
};

export const getExpenseById = (id) => {
  return axiosClient.get(`/api/expenses/${id}`);
};

export const createExpense = (expenseData) => {
  // Send as FormData for file upload support
  const formData = new FormData();
  Object.keys(expenseData).forEach(key => {
    if (expenseData[key] !== null && expenseData[key] !== undefined && expenseData[key] !== '') {
      formData.append(key, expenseData[key]);
    }
  });
  return axiosClient.post('/api/expenses', formData);
};

export const updateExpense = (id, expenseData) => {
  // Send as FormData for file upload support
  const formData = new FormData();
  Object.keys(expenseData).forEach(key => {
    if (expenseData[key] !== null && expenseData[key] !== undefined && expenseData[key] !== '') {
      formData.append(key, expenseData[key]);
    }
  });
  return axiosClient.patch(`/api/expenses/${id}`, formData);
};

export const deleteExpense = (id) => {
  return axiosClient.delete(`/api/expenses/${id}`);
};

export const getExpenseSummary = (params) => {
  return axiosClient.get('/api/expenses/summary', { params });
};

export const exportExpenses = (params) => {
  return axiosClient.get('/api/expenses/export', {
    params,
    responseType: 'blob'
  });
};
