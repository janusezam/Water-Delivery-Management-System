import { axiosClient } from './axios';

export const getSalesSummary = (startDate, endDate) => {
  return axiosClient.get('/api/reports/sales', { params: { startDate, endDate } });
};

export const getInventorySummary = () => {
  return axiosClient.get('/api/reports/inventory');
};

export const getDriverPerformance = (startDate, endDate) => {
  return axiosClient.get('/api/reports/drivers', { params: { startDate, endDate } });
};

export const getCustomerActivity = () => {
  return axiosClient.get('/api/reports/customers');
};

export const getReportSummary = () => {
  return axiosClient.get('/api/reports/summary');
};
