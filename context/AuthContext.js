import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { fetchUsers } from '../data/Data'; // Kullanıcı verilerini almak için bir fonksiyon

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Mevcut kullanıcıyı saklamak için state
  const [users, setUsers] = useState([]); // Tüm kullanıcıları saklamak için state

  // Bileşen yüklendiğinde kullanıcı verilerini ve mevcut kullanıcıyı yükle
  useEffect(() => {
    const initializeData = async () => {
      await loadUsers(); // Tüm kullanıcıları yükle
      await loadUser(); // Mevcut kullanıcıyı yükle
    };
    initializeData();
  }, []);

  // Tüm kullanıcıları veritabanından veya API'dan yükle
  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error("Kullanıcıları yükleme hatası:", error);
    }
  };

  // AsyncStorage'dan mevcut kullanıcıyı yükle
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

  // Parolayı SHA-256 ile hashle
  const hashPassword = async (password) => {
    try {
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );
    } catch (error) {
      console.error('Şifre hashleme hatası:', error);
    }
  };

  // Kullanıcı giriş fonksiyonu
  const login = async (email, password) => {
    try {
      const foundUser = users.find((u) => u.email === email);
      if (foundUser) {
        const match = await verifyPassword(password, foundUser.password);
        if (match) {
          setUser(foundUser);
          await AsyncStorage.setItem('user', JSON.stringify(foundUser));
          return { success: true };
        } else {
          return { success: false, message: 'Şifre yanlış' };
        }
      } else {
        return { success: false, message: 'Kullanıcı bulunamadı' };
      }
    } catch (error) {
      console.error('Giriş sırasında bir hata oluştu:', error);
      return { success: false, message: 'Giriş hatası' };
    }
  };

  // Şifre doğrulama fonksiyonu
  const verifyPassword = async (password, hashedPassword) => {
    const hashedInputPassword = await hashPassword(password);
    return hashedInputPassword === hashedPassword;
  };

  // Kullanıcı çıkış fonksiyonu
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Çıkış sırasında bir hata oluştu:', error);
    }
  };


  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loadUsers }}>
      {children} 
    </AuthContext.Provider>
  );
};


export { AuthContext, AuthProvider };
