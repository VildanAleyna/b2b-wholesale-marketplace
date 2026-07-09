import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const previousUserId = useRef(user?._id || null);

  useEffect(() => {
    const currentUserId = user?._id || null;

    if (previousUserId.current && !currentUserId) {
      setCart([]);
    }

    previousUserId.current = currentUserId;
  }, [user?._id]);

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
      const initialCount = Math.max(1, Number(item.minOrderQuantity) || 1);
      return [...prevCart, { ...item, count: initialCount }];
    });

    return { ok: true };
  };

  const removeFromCart = (_id) => {
    setCart((prevCart) => prevCart.filter(item => item._id !== _id));
  };

  const clearCart = () => {
    setCart([]);
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
      prevCart.map(item => {
        if (item._id !== _id) {
          return item;
        }

        const minOrderQuantity = Math.max(1, Number(item.minOrderQuantity) || 1);
        return {
          ...item,
          count: Math.max(minOrderQuantity, item.count - 1)
        };
      })
    );
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      increaseCount,
      decreaseCount,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
