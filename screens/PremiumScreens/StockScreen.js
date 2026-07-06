import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import { fetchUserProducts, fetchBrandById, fetchCategoryById, fetchModelById, deleteProductById, updateProductPrice } from '../../data/Data';
import { AuthContext } from '../../context/AuthContext';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const StockScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState({});
  const [models, setModels] = useState({});
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [temporaryPrices, setTemporaryPrices] = useState({});
  const { user } = useContext(AuthContext);

  useFocusEffect(
    React.useCallback(() => {
      const getUserProducts = async () => {
        try {
          const data = await fetchUserProducts(user._id);
          setProducts(data);

          const brandIds = [...new Set(data.map(product => product.brandId))];
          const categoryIds = [...new Set(data.map(product => product.categoryId))];
          const modelIds = [...new Set(data.map(product => product.modelId))];

          const brandPromises = brandIds.map(id => fetchBrandById(id));
          const categoryPromises = categoryIds.map(id => fetchCategoryById(id));
          const modelPromises = modelIds.map(id => fetchModelById(id));

          const [brandData, categoryData, modelData] = await Promise.all([
            Promise.all(brandPromises),
            Promise.all(categoryPromises),
            Promise.all(modelPromises)
          ]);

          const brandMap = brandData.reduce((map, brand) => {
            map[brand._id] = brand;
            return map;
          }, {});

          const categoryMap = categoryData.reduce((map, category) => {
            map[category._id] = category;
            return map;
          }, {});

          const modelMap = modelData.reduce((map, model) => {
            map[model._id] = model;
            return map;
          }, {});

          setBrands(brandMap);
          setCategories(categoryMap);
          setModels(modelMap);

          const initialPrices = data.reduce((acc, product) => {
            acc[product._id] = product.wholesalers[0].price;
            return acc;
          }, {});
          setTemporaryPrices(initialPrices);
        } catch (err) {
          setError('Ürünler alınamadı.');
          console.error('Ürünler alınamadı:', err);
        } finally {
          setLoading(false);
        }
      };

      getUserProducts();
    }, [user._id])
  );

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProductById(productId);
      setProducts(products.filter(product => product._id !== productId));
      const { [productId]: _, ...rest } = temporaryPrices;
      setTemporaryPrices(rest);
    } catch (err) {
      Alert.alert('Hata', 'Ürün silinirken bir hata oluştu.');
    }
  };

  const handleSavePrices = async () => {
    try {
      const priceUpdatePromises = Object.keys(temporaryPrices).map(productId => {
        const newPrice = temporaryPrices[productId];
        return updateProductPrice(productId, newPrice);
      });
      await Promise.all(priceUpdatePromises);
      setProducts(products.map(product => ({
        ...product,
        wholesalers: [{ price: temporaryPrices[product._id] }]
      })));
      Alert.alert('Başarılı', 'Fiyatlar başarıyla güncellendi.');
    } catch (err) {
      Alert.alert('Hata', 'Fiyat güncellenirken bir hata oluştu.');
    }
  };

  if (loading) {
    return <Text>Yükleniyor...</Text>;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  const renderItem = ({ item }) => (
    <View  style={styles.item}>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteProduct(item._id)}>
        <AntDesign name="delete" size={24} color="red" />
      </TouchableOpacity>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title || 'Ad Yok'}</Text>
        <Text style={styles.category}>{categories[item.categoryId]?.name || 'Kategori Bilgisi Yok'}</Text>
        <Text style={styles.model}>{models[item.modelId]?.name || 'Model Bilgisi Yok'}</Text>
        <Text style={styles.brand}>{brands[item.brandId]?.name || 'Marka Bilgisi Yok'}</Text>
        <Text style={styles.priceInput}>{String(temporaryPrices[item._id] || 'Fiyatı Yok')} ₺ </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <TouchableOpacity onPress={handleSavePrices} style={styles.fab}>
        <View style={styles.iconTextContainer}>
          <AntDesign name="save" size={24} color="white" />
          <Text style={styles.headerButtonText}>Kaydet</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff2f2', // Temaya uygun arka plan rengi
  },
  item: {
    backgroundColor: '#fff', // Temaya uygun arka plan rengi
    padding: 15,
    flexDirection: 'row',
    borderRadius: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FF6F61', // Temaya uygun sınır rengi
    marginBottom: 15,
  },
  deleteButton: {
    marginRight: 15,
    marginTop: 60,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 10,
    borderRadius: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  title: {
    fontSize: 20,
    color: 'black', // Temaya uygun yazı rengi
    marginBottom: 5,
    fontWeight: 'bold',
  },
  category: {
    fontSize: 16,
    color: 'black', // Temaya uygun yazı rengi
    marginBottom: 5,
  },
  brand: {
    fontSize: 16,
    color: 'black', // Temaya uygun yazı rengi
    marginBottom: 5,
  },
  model: {
    fontSize: 16,
    color: 'black', // Temaya uygun yazı rengi
    marginBottom: 5,
  },
  priceInput: {
    width: 60,
    height: 30,
    marginHorizontal: 10,
    color: 'black', // Temaya uygun yazı rengi
    fontSize: 16,
    fontWeight: 'bold',
  },
  separator: {
    height: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 80,
    height: 80,
    backgroundColor: '#FF6F61', // Temaya uygun FAB arka plan rengi
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  headerButton: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FF6F61', // Temaya uygun başlık butonu arka plan rengi
    borderRadius: 5,
    marginRight: 10,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
  },
  iconTextContainer: {
    alignItems: 'center',
  },
});

export default StockScreen;
