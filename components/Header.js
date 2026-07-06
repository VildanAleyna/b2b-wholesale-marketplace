import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import Ionic from 'react-native-vector-icons/Ionicons';

const Header = ({ navigation, route }) => {
  const getHeaderTitle = (routeName) => {
    switch (routeName) {
      case 'Stock':
        return 'Stok Takip Ekranı';
      case 'EmployeeMenu':
        return 'Çalışan Menü Ekranı';
      case 'Case':
        return 'Kasa';
      case 'AddProduct':
        return 'Ürün Ekleme';
      case 'Cart':
        return 'Sepetim';
      case 'CategoryDetail':
        return 'Kategori Detayı';
      default:
        return 'Başlık';
    }
  };

  const routeName = route.name || '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionic name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{getHeaderTitle(routeName)}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF6F61', // Header arka plan rengi
    height: 80, // Header yüksekliği
    overflow: 'hidden', // Yuvarlatılmış köşelerin düzgün görünmesi için
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 10,
    bottom: 20,
  },
  title: {
    color: '#FFF', // Başlık rengi
    fontSize: 20, // Başlık boyutu
    fontWeight: 'bold',
    bottom: -5,
  },
});

export default Header;
