import { apiClient } from '../apiClient';

export const fetchEmployees = async (wholesalerId) => {
  try {
    const response = await apiClient.get(`/wholesalers/${wholesalerId}/employees`);
    return response.data;
  } catch (error) {
    console.error('Personel listesi alinamadi:', error);
    return null;
  }
};

export const addEmployee = async (wholesalerId, employeeData) => {
  const response = await apiClient.post(`/wholesalers/${wholesalerId}/employees`, employeeData);
  return response.data;
};

export const deleteEmployee = async (wholesalerId, employeeName) => {
  const response = await apiClient.delete(`/wholesalers/${wholesalerId}/employees/${encodeURIComponent(employeeName)}`);
  return response.data;
};
