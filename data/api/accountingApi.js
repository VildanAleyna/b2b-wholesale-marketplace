import { apiClient } from '../apiClient';

export const fetchUserCariAccounts = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}/accounts`);
    return response.data;
  } catch (error) {
    console.error('Cari hesaplar alinamadi:', error);
    return [];
  }
};

export const fetchWholesalerAccounts = async (wholesalerId) => {
  try {
    const response = await apiClient.get(`/wholesalers/${wholesalerId}/accounts`);
    return response.data;
  } catch (error) {
    console.error('Bayi cari hesaplari alinamadi:', error);
    return [];
  }
};

export const fetchUserStatement = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}/statement`);
    return response.data;
  } catch (error) {
    console.error('Cari ekstre alinamadi:', error);
    return [];
  }
};

export const submitPaymentNotification = async (customerId, wholesalerId, amount, receiptFile) => {
  try {
    const response = await apiClient.post('/payments/notify', {
      customerId,
      wholesalerId,
      amount,
      receiptFile,
    });
    return response.data;
  } catch (error) {
    console.error('Odeme bildirimi gonderilemedi:', error);
    return null;
  }
};

export const fetchWholesalerPayments = async (wholesalerId) => {
  try {
    const response = await apiClient.get(`/wholesalers/${wholesalerId}/payments`);
    return response.data;
  } catch (error) {
    console.error('Odeme bildirimleri alinamadi:', error);
    return [];
  }
};

export const updatePaymentStatus = async (paymentId, status) => {
  try {
    const response = await apiClient.put(`/payments/${paymentId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Odeme durumu guncellenemedi:', error);
    return null;
  }
};
