import React, { useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { CartContext } from '../context/CartContext';

const OrderHistoryScreen = ({ route }) => {
  const { order } = route.params || {}; // Route parametrelerinden sipariş verilerini alır
  const { orderHistory, addToOrderHistory } = useContext(CartContext); // Sipariş geçmişini almak ve güncellemek için CartContext'ten gerekli fonksiyonları alır

  const products = [
    { id: '1', title: 'Stanley Termos', category: 'Termos', image: require('../assets/urun/termos.png'), price: 1000 },
    { id: '2', title: 'Gloss', category: 'Make-up', image: require('../assets/urun/gloss.png'), price: 200 },
  ]; // Ürünlerin statik bir listesini tanımlar

  useEffect(() => {
    if (order) {
      addToOrderHistory(order); // Yeni bir sipariş varsa, bu siparişi sipariş geçmişine ekler
    }
  }, [order]); // 'order' değiştiğinde useEffect çalışır

  const calculateTotalPrice = (orderProducts) => {
    // Sipariş ürünlerinin toplam fiyatını hesaplar
    return orderProducts.reduce((total, product) => {
      const productDetails = products.find(p => p.id === product.id); // Ürün listesinden sipariş edilen ürünü bulur
      if (!productDetails) {
        console.error(`Product with ID ${product.id} not found.`); // Eğer ürün bulunamazsa, hata mesajı verir
        return total; // Ürün bulunamadığı için mevcut toplam değeri döndürür
      }
      return total + (productDetails.price * product.count); // Ürün fiyatını miktar ile çarpıp toplam değere ekler
    }, 0); // Toplam değerin başlangıç değeri 0'dır
  };

  const renderOrderItem = ({ item }) => {
    // Bir siparişin içindeki ürünleri render eder
    const orderProducts = (item.products || []).map(product => {
      const productDetails = products.find(p => p.id === product.id); // Ürünü ürün listesinden bulur
      return {
        ...product, // Ürün bilgilerini siparişten alır
        ...productDetails, // Detayları ürün listesinden ekler
      };
    });

    const totalPrice = calculateTotalPrice(orderProducts); // Siparişin toplam fiyatını hesaplar

    return (
      <View style={styles.orderContainer}>
        <Text style={styles.orderDate}>Tarih: {new Date(item.date).toLocaleDateString('tr-TR')}</Text> 
        {/* Sipariş tarihini gösterir */}
        <Text style={styles.orderTotal}>Toplam: {totalPrice}₺</Text> 
        {/* Siparişin toplam fiyatını gösterir */}
        {orderProducts.map((product) => (
          <View key={product.id} style={styles.productContainer}>
            <Image source={product.image} style={styles.productImage} /> 
            {/* Ürünün resmini gösterir */}
            <View style={styles.productDetails}>
              <Text style={styles.productTitle}>{product.title}</Text> 
              {/* Ürünün başlığını gösterir */}
              <Text style={styles.productPrice}>Fiyat: {product.price}₺</Text> 
              {/* Ürünün fiyatını gösterir */}
              <Text style={styles.productQuantity}>Adet: {product.count}</Text> 
              {/* Ürünün sipariş edilen miktarını gösterir */}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <FlatList
      data={orderHistory} // Sipariş geçmişini liste olarak gösterir
      renderItem={renderOrderItem} // Her siparişi renderOrderItem fonksiyonu ile render eder
      keyExtractor={(item) => item.date ? new Date(item.date).toISOString() : Math.random().toString()} 
      // Her bir sipariş için benzersiz bir anahtar üretir
      contentContainerStyle={styles.container} // Liste stilini ayarlar
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16, // Listeye içeriden boşluk ekler
  },
  orderContainer: {
    marginBottom: 24, // Her sipariş kartının altına boşluk ekler
    padding: 16, // Sipariş kartının içindeki içeriklere boşluk ekler
    backgroundColor: '#f9f9f9', // Kartın arka plan rengini ayarlar
    borderRadius: 8, // Kartın kenarlarını yuvarlar
    shadowColor: '#000', // Kartın gölge rengini ayarlar
    shadowOpacity: 0.1, // Gölge opaklığını ayarlar
    shadowRadius: 10, // Gölge genişliğini ayarlar
    elevation: 5, // Android'de gölge efektini ekler
  },
  orderDate: {
    fontSize: 16, // Sipariş tarihinin yazı boyutunu ayarlar
    fontWeight: 'bold', // Tarih yazısını kalın yapar
  },
  orderTotal: {
    fontSize: 16, // Toplam fiyatın yazı boyutunu ayarlar
    marginBottom: 8, // Toplam fiyatın altında boşluk bırakır
  },
  productContainer: {
    flexDirection: 'row', // Ürün bilgilerini yatay olarak hizalar
    alignItems: 'center', // Ürün bilgilerini dikey olarak ortalar
    marginBottom: 8, // Ürünler arasında boşluk bırakır
  },
  productImage: {
    width: 50, // Ürün resminin genişliğini ayarlar
    height: 50, // Ürün resminin yüksekliğini ayarlar
    marginRight: 16, // Resim ile detaylar arasında boşluk bırakır
  },
  productDetails: {
    flex: 1, // Ürün detaylarının bulunduğu alanın tüm genişliği kaplamasını sağlar
  },
  productTitle: {
    fontSize: 16, // Ürün başlığının yazı boyutunu ayarlar
    fontWeight: 'bold', // Ürün başlığını kalın yapar
  },
  productPrice: {
    fontSize: 14, // Ürün fiyatının yazı boyutunu ayarlar
  },
  productQuantity: {
    fontSize: 14, // Ürün miktarının yazı boyutunu ayarlar
  },
});

export default OrderHistoryScreen;
