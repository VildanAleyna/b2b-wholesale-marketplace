import { apiClient } from '../apiClient';

export const submitPurchase = async (userId, purchaseDetails) => {
  try {
    const response = await apiClient.post(`/users/${userId}/purchase`, purchaseDetails);
    return response.data;
  } catch (error) {
    console.error('Siparis gonderilemedi:', error);
    throw error;
  }
};

export const fetchUserOrders = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}/orders`);
    return response.data;
  } catch (error) {
    console.error('Siparisler alinamadi:', error);
    return [];
  }
};

export const fetchWholesalerOrders = async (wholesalerId) => {
  try {
    const response = await apiClient.get(`/wholesalers/${wholesalerId}/orders`);
    return response.data;
  } catch (error) {
    console.error('Gelen siparisler alinamadi:', error);
    return [];
  }
};

export const fetchWholesalerInsights = async (wholesalerId) => {
  try {
    const response = await apiClient.get(`/wholesalers/${wholesalerId}/insights`);
    return response.data;
  } catch (error) {
    console.error('Operasyon analizleri alinamadi:', error);
    return null;
  }
};

export const updateOrderStatus = async (customerId, orderId, status, trackingNumber) => {
  try {
    const response = await apiClient.put(`/customers/${customerId}/orders/${orderId}/status`, {
      status,
      trackingNumber,
    });
    return response.data;
  } catch (error) {
    console.error('Siparis durumu guncellenemedi:', error);
    return null;
  }
};

export const submitOrderRating = async (customerId, orderId, rating, review) => {
  try {
    const response = await apiClient.put(`/customers/${customerId}/orders/${orderId}/rate`, {
      rating,
      review,
    });
    return response.data;
  } catch (error) {
    console.error('Toptanci degerlendirmesi gonderilemedi:', error);
    return null;
  }
};
