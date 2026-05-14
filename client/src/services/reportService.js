import { axiosClient } from './axios';

export const getReportSummary = () => {
  return axiosClient.get('/api/reports/summary');
};

export const getComprehensiveReport = (period, from, to) => {
  const params = { period };
  if (from && to) {
    params.from = from;
    params.to = to;
  }
  return axiosClient.get('/api/reports/comprehensive', { params });
};
