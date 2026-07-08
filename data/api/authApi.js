import { apiClient } from '../apiClient';

export const registerUser = async (userData) => {
  const response = await apiClient.post('/register', userData);
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await apiClient.post('/login', { email, password });
  return response.data;
};

export const fetchUserById = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Kullanici alinamadi:', error);
    return null;
  }
};

export const updateUserProfile = async (userId, profileDetails) => {
  try {
    const response = await apiClient.put(`/users/${userId}/profile`, profileDetails);
    return response.data;
  } catch (error) {
    console.error('Profil guncellenemedi:', error);
    return null;
  }
};

export const updateUserSettings = async (userId, settingsDetails) => {
  try {
    const response = await apiClient.put(`/users/${userId}/settings`, settingsDetails);
    return response.data;
  } catch (error) {
    console.error('Ayarlar guncellenemedi:', error);
    return null;
  }
};
