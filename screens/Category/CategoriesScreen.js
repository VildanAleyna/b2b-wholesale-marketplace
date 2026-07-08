import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ImageBackground, Platform, ScrollView } from 'react-native';
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
          const isEven = index % 2 === 0;

          return (
            <TouchableOpacity
              key={item._id}
              style={[
                styles.card,
                isEven ? styles.cardLeft : styles.cardRight,
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
    paddingHorizontal: isWeb ? 28 : 18,
    paddingTop: isWeb ? 26 : 18,
    paddingBottom: 120,
    alignItems: 'center',
  },
  list: {
    width: '100%',
    maxWidth: 980,
    marginTop: 6,
  },
  card: {
    width: isWeb ? '68%' : '92%',
    height: isWeb ? 158 : 132,
    marginBottom: isWeb ? 24 : 18,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  cardLeft: {
    alignSelf: 'flex-start',
  },
  cardRight: {
    alignSelf: 'flex-end',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  cardOverlay: {
    backgroundColor: 'rgba(30, 58, 138, 0.85)',
    minHeight: isWeb ? 58 : 50,
    paddingVertical: isWeb ? 13 : 11,
    paddingHorizontal: isWeb ? 22 : 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: isWeb ? 18 : 15,
    fontWeight: 'bold',
    letterSpacing: 0.2,
    flex: 1,
    marginRight: 12,
  },
  badge: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 11,
    borderRadius: 12,
  },
  badgeText: {
    color: '#1E3A8A',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default CategoriesScreen;
