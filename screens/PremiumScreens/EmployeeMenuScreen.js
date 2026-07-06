import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

const menuItems = [
  { id: '1', title: 'Kasa İşlemleri', icon: 'briefcase-outline', screen: 'Case',Ionicons: true  },
  { id: '3', title: 'Stoklar', icon: 'box', screen: 'Stock' },
  { id: '4', title: 'Siparişler', icon: 'shopping-cart', screen: 'Orders' },
  { id: '5', title: 'Ürün Ekleme', icon: 'bag-add-outline', screen: 'AddProduct', Ionicons: true },
  { id: '6', title: 'Ürün Silme', icon: 'bag-remove-outline', screen: 'AddProduct', Ionicons: true },
  { id: '7', title: 'Raporlar', icon: 'file-text', screen: 'Reports' },
  { id: '8', title: 'Ayarlar', icon: 'settings', screen: 'Settings' },

];

const EmployeeMenuScreen = () => {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.menuContainer}>
        {menuItems.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.item} 
            onPress={() => item.screen && navigation.navigate(item.screen)}
          >
          {item.Ionicons ? (
            <Ionicons name={item.icon} size={24} color="#fff" />
          ) : (
            <Feather name={item.icon} size={24} color="#fff" />
          )}
            <Text style={styles.title}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff2f2', // Arka plan rengini temaya uygun yaptık
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  item: {
    width: '45%', // Her öğenin genişliğini ayarlayarak iki öğe yan yana olacak şekilde düzenler
    alignItems: 'center',
    marginVertical: 10,
    padding: 15,
    backgroundColor: '#FF6F61', // Temaya uygun renk
    borderRadius: 10,
  },
  title: {
    marginTop: 5,
    fontSize: 16,
    color: 'white', // Yazı rengini temaya uygun yaptık
  },
});

export default EmployeeMenuScreen;
