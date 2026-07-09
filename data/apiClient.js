import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getDefaultApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl();

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

let cachedAuthToken;
let tokenLoadPromise;

export const setAuthToken = async (token) => {
  cachedAuthToken = token || null;

  if (token) {
    await AsyncStorage.setItem('authToken', token);
    return;
  }

  await AsyncStorage.removeItem('authToken');
};

export const clearAuthSession = async () => {
  cachedAuthToken = null;
  await AsyncStorage.multiRemove(['authToken', 'user']);
};

const getAuthToken = async () => {
  if (cachedAuthToken !== undefined) {
    return cachedAuthToken;
  }

  if (!tokenLoadPromise) {
    tokenLoadPromise = AsyncStorage.getItem('authToken').then((token) => {
      cachedAuthToken = token || null;
      tokenLoadPromise = null;
      return cachedAuthToken;
    });
  }

  return tokenLoadPromise;
};

apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAuthSession();
    }

    return Promise.reject(error);
  }
);
