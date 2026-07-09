import { apiClient } from '../apiClient';

const sameId = (left, right) => (left?._id || left)?.toString() === (right?._id || right)?.toString();

export const removeFavorite = async (productId, user, setUser) => {
  if (!user) return;

  const previousFavorites = user.favorites || [];
  const updatedFavorites = previousFavorites.filter((id) => !sameId(id, productId));
  setUser((prevState) => ({ ...prevState, favorites: updatedFavorites }));

  try {
    const response = await apiClient.put(`/users/${user._id}/favorites/remove`, { productId });

    if (response.status !== 200) {
      throw new Error('Favori silme hatasi');
    }
  } catch (error) {
    console.error('Favori silinemedi:', error);
    setUser((prevState) => ({ ...prevState, favorites: previousFavorites }));
    throw error;
  }
};

export const addFavorite = async (productId, user, setUser) => {
  if (!user) return;

  const previousFavorites = user.favorites || [];
  const updatedFavorites = previousFavorites.some(id => sameId(id, productId))
    ? previousFavorites
    : [...previousFavorites, productId];
  setUser((prevState) => ({ ...prevState, favorites: updatedFavorites }));

  try {
    const response = await apiClient.put(`/users/${user._id}/favorites/add`, { productId });

    if (response.status !== 200) {
      throw new Error('Favori kaydetme hatasi');
    }
  } catch (error) {
    console.error('Favori kaydedilemedi:', error);
    setUser((prevState) => ({ ...prevState, favorites: previousFavorites }));
    throw error;
  }
};

export const fetchFavoriteProducts = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}/favorites`);
    return response.data;
  } catch (error) {
    console.error('Favori urunler alinamadi:', error);
    return [];
  }
};

export const fetchWholesalerDetails = async (wholesalerId) => {
  try {
    const response = await apiClient.get(`/wholesalers/${wholesalerId}`);
    return response.data;
  } catch (error) {
    console.error('Toptanci bilgileri alinamadi:', error);
    return null;
  }
};

export const fetchCustomerInsights = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}/insights`);
    return response.data;
  } catch (error) {
    console.error('Bayi analizleri alinamadi:', error);
    return null;
  }
};
