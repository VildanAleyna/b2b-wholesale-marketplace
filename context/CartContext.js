import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);

  const getWholesalerId = (item) => (
    item?.selectedWholesalerId ||
    item?.wholesalers?.[0]?.usersID?._id ||
    item?.wholesalers?.[0]?.usersID
  )?.toString();

  const addToCart = (item) => {
    const cartWholesalerId = getWholesalerId(cart[0]);
    const itemWholesalerId = getWholesalerId(item);

    if (cartWholesalerId && itemWholesalerId && cartWholesalerId !== itemWholesalerId) {
      return {
        ok: false,
        message: 'Sepette farkli bir toptanciya ait urun var. Once mevcut sepeti tamamlayin veya bosaltin.'
      };
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find(cartItem => cartItem._id === item._id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem._id === item._id ? { ...cartItem, count: cartItem.count + 1 } : cartItem
        );
      }
      return [...prevCart, { ...item, count: 1 }];
    });

    return { ok: true };
  };

  const removeFromCart = (_id) => {
    setCart((prevCart) => prevCart.filter(item => item._id !== _id));
  };

  const increaseCount = (_id) => {
    setCart((prevCart) =>
      prevCart.map(item =>
        item._id === _id ? { ...item, count: item.count + 1 } : item
      )
    );
  };

  const decreaseCount = (_id) => {
    setCart((prevCart) =>
      prevCart.map(item =>
        item._id === _id ? { ...item, count: item.count - 1 } : item
      ).filter(item => item.count > 0)
    );
  };

  const addToOrderHistory = (order) => {
    setOrderHistory((prevOrders) => [...prevOrders, { ...order, date: new Date() }]);
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
