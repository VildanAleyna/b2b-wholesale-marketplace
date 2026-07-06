import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../data/Data';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Kullanıcıyı yükleme hatası:", error);
    }
  };

  const login = async (email, password) => {
    try {
      const authenticatedUser = await loginUser(email, password);
      setUser(authenticatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(authenticatedUser));
      return { success: true };
    } catch (error) {
      console.error('Giriş sırasında bir hata oluştu:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Giriş hatası',
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Çıkış sırasında bir hata oluştu:', error);
    }
  };


  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children} 
    </AuthContext.Provider>
  );
};


export { AuthContext, AuthProvider };
