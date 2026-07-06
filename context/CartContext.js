import React, { createContext, useState } from 'react';

// CartContext adlı bir context oluşturuyoruz
export const CartContext = createContext();

// CartProvider bileşeni, tüm çocuk bileşenlere cart (sepet) verilerini ve işlemleri sağlar
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]); // Sepet öğelerini tutmak için state
  const [orderHistory, setOrderHistory] = useState([]); // Sipariş geçmişi durumunu tutmak için state

  // Sepete yeni bir ürün ekleme fonksiyonu
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(cartItem => cartItem._id === item._id); // Sepette mevcut olan ürünü bul
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem._id === item._id ? { ...cartItem, count: cartItem.count + 1 } : cartItem
        ); // Eğer ürün sepette varsa, miktarını artır
      }
      return [...prevCart, { ...item, count: 1 }]; // Ürün sepette değilse, sepete ekle ve miktarını 1 yap
    });
  };

  // Sepetten bir ürünü kaldırma fonksiyonu
  const removeFromCart = (_id) => {
    setCart((prevCart) => prevCart.filter(item => item._id !== _id)); // Ürünü id'sine göre sepetten çıkar
  };

  // Ürünün miktarını artırma fonksiyonu
  const increaseCount = (_id) => {
    setCart((prevCart) =>
      prevCart.map(item =>
        item._id === _id ? { ...item, count: item.count + 1 } : item
      ) // Ürün id'sine göre miktarını artır
    );
  };

  // Ürünün miktarını azaltma fonksiyonu
  const decreaseCount = (_id) => {
    setCart((prevCart) =>
      prevCart.map(item =>
        item._id === _id ? { ...item, count: item.count - 1 } : item
      ).filter(item => item.count > 0) // Ürün miktarı 0'a ulaşırsa, ürünü sepetten çıkar
    );
  };

  // Sipariş geçmişine yeni sipariş ekleme fonksiyonu
  const addToOrderHistory = (order) => {
    setOrderHistory((prevOrders) => [...prevOrders, { ...order, date: new Date() }]); // Siparişe tarih ekleyip sipariş geçmişine ekle
  };

  return (
    <CartContext.Provider value={{ 
        cart, 
        addToCart, 
        removeFromCart, 
        increaseCount, 
        decreaseCount, 
        orderHistory, 
        addToOrderHistory 
      }}>
      {children} 
    </CartContext.Provider>
  );
};
