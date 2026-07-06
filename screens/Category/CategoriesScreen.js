import React, { useEffect, useState } from 'react';
import { Text, View, Dimensions, TouchableOpacity, StyleSheet, ImageBackground, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchCategories, fetchProducts } from '../../data/Data';

const isWeb = Platform.OS === 'web';

const CategoriesScreen = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const loadData = async () => {
      const catsData = await fetchCategories();
      const prodsData = await fetchProducts();
      setCategories(catsData);
      setProducts(prodsData);
    };

    loadData();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.list}>
        {categories.map((item, index) => {
          const count = products.filter(p => p.categoryId === item._id).length;
          // Sıralamaya göre biri sola (çift indeksli), biri sağa (tek indeksli) yaslanacak
          const isEven = index % 2 === 0;

          return (
            <TouchableOpacity 
              key={item._id} 
              style={[
                styles.card, 
                isEven ? styles.cardLeft : styles.cardRight
              ]} 
              onPress={() => navigation.navigate('CategoryDetail', { category: item })}
            >
              <ImageBackground 
                source={{ uri: item.image }} 
                style={styles.cardImage} 
                imageStyle={{ borderRadius: 20 }}
              >
                <View style={styles.cardOverlay}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{count} Ürün</Text>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    padding: 24,
    alignItems: 'center',
  },
  list: {
    width: '100%',
    maxWidth: 1000, // Anasayfa ile uyumlu maksimum genişlik
    marginTop: 10,
  },
  card: {
    width: isWeb ? '75%' : '90%', // Web'de ekranın %75'ini kaplar, girinti hissi verir
    height: isWeb ? 200 : 140, // Web'de kartlar daha yüksek ve ferah
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardLeft: {
    alignSelf: 'flex-start', // Sola yasla (Girintili)
  },
  cardRight: {
    alignSelf: 'flex-end', // Sağa yasla (Çıkıntılı)
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  cardOverlay: {
    backgroundColor: 'rgba(30, 58, 138, 0.85)', // Yarı şeffaf kurumsal Lacivert
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: isWeb ? 20 : 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  badgeText: {
    color: '#1E3A8A', // Lacivert metin
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default CategoriesScreen;
