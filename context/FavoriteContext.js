import React, { createContext, useState, useContext } from 'react';
import { addFavorite, removeFavorite, fetchFavoriteProducts } from '../data/Data';
import { AuthContext } from './AuthContext';

const FavoriteContext = createContext();

export const FavoriteProvider = ({ children }) => {
  const { user, setUser } = useContext(AuthContext); // AuthContext'i kullanarak setUser'ı alın
  const [favoriteItems, setFavoriteItems] = useState([]);

  const loadFavoriteItems = async (userId) => {
    try {
      const favoriteProducts = await fetchFavoriteProducts(userId);
      setFavoriteItems(favoriteProducts.map(product => product.id));
    } catch (error) {
      console.error('Favori ürünler yüklenemedi:', error);
    }
  };

  const toggleFavorite = async (itemId) => {
    if (!user) {
      console.error('Kullanıcı girişi gerekli');
      return;
    }

    try {
      if (favoriteItems.includes(itemId)) {
        await removeFavorite(itemId, user._id);
        setFavoriteItems(favoriteItems.filter(id => id !== itemId));
      } else {
        await addFavorite(itemId, user._id);
        setFavoriteItems([...favoriteItems, itemId]);
      }
      // Kullanıcı verilerini güncelle
      if (setUser) {
        setUser(prevUser => ({
          ...prevUser,
          favorites: favoriteItems.includes(itemId)
            ? prevUser.favorites.filter(id => id !== itemId)
            : [...prevUser.favorites, itemId],
        }));
      }
    } catch (error) {
      console.error('Favori işleme hatası:', error);
    }
  };

  return (
    <FavoriteContext.Provider value={{ favoriteItems, toggleFavorite, loadFavoriteItems }}>
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoriteContext);
