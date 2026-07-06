import React, { useContext } from 'react';
import { SafeAreaView, View, FlatList, StyleSheet, Text, Image, TouchableOpacity, StatusBar } from 'react-native';
import { CartContext } from '../context/CartContext'; // Context'i import ediyoruz

const CartScreen = () => {
  const { cart, removeFromCart, increaseCount, decreaseCount } = useContext(CartContext); // Context'ten gerekli fonksiyonları alıyoruz

  // FlatList öğe render fonksiyonu
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.image} />
      )}
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.counterContainer}>
        <TouchableOpacity onPress={() => decreaseCount(item._id)} style={styles.button}>
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.count}>{item.count}</Text>
        <TouchableOpacity onPress={() => increaseCount(item._id)} style={styles.button}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removeFromCart(item._id)} style={[styles.button, styles.removeButton]}>
          <Text style={styles.buttonText}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={cart}
        renderItem={renderItem}
        keyExtractor={item => item._id ? item._id.toString() : Math.random().toString()} // Güncelleme yapıldı
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dddddd',
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 20,
  },
  title: {
    fontSize: 18,
    flex: 1,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    marginHorizontal: 10,
    fontSize: 18,
  },
  button: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
  },
  removeButton: {
    backgroundColor: '#ff6f61',
  },
});

export default CartScreen;
