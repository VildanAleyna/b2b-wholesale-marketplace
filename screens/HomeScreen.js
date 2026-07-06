import React, { useContext, useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  Text,
  StatusBar,
  Image,
  Platform,
  ToastAndroid,
  Alert,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Button,
  Modal
} from 'react-native';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { fetchProducts, addFavorite, removeFavorite } from '../data/Data';
import Carousel from "react-native-reanimated-carousel";
import { Ionicons } from '@expo/vector-icons';

const ITEMS_PER_PAGE = 8;
const width = Dimensions.get('window').width;
const isWeb = Platform.OS === 'web';
const carouselWidth = isWeb ? Math.min(width - 40, 1000) : width - 20;
const carouselHeight = isWeb ? 300 : width / 2 + 10;

const imageUrls = [
  'https://images.unsplash.com/photo-1555421689-491a97ff2040?q=80&w=1000', // Teknoloji & Toptan Kampanya afişi
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1000', // Lojistik & Toptan Dağıtım afişi
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000', // İstatistik & Büyüme afişi
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1000'  // Mutfak & Züccaciye Fırsatları afişi
];

const Item = ({ price, title, image, onAddToCart, onToggleFavorite, isFavorite, wholesalers, onWholesalerPress, user }) => {
  const getLowestPrice = (wholesalers) => {
    if (!wholesalers || wholesalers.length === 0) return price;
    return Math.min(...wholesalers.map(wholesaler => wholesaler.price));
  };

  const getDiscountMultiplier = () => {
    if (!user) return 1.0;
    if (user.tier === 'Gold') return 0.8; // %20 İndirim
    if (user.tier === 'Silver') return 0.9; // %10 İndirim
    return 1.0;
  };

  const lowestPrice = getLowestPrice(wholesalers);
  const discountMultiplier = getDiscountMultiplier();
  const discountedPrice = lowestPrice ? Math.round(lowestPrice * discountMultiplier) : 0;
  const mainWholesaler = wholesalers?.[0];

  return (
    <View style={styles.item}>
      <Image source={{ uri: image }} style={styles.image} />
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      
      {mainWholesaler && (
        <TouchableOpacity style={styles.wholesalerContainer} onPress={onWholesalerPress}>
          <Ionicons name="business-outline" size={12} color="#F97316" style={{ marginRight: 4 }} />
          <Text style={styles.wholesalerText} numberOfLines={1}>
            {mainWholesaler.name || 'Tedarikçi'}
          </Text>
        </TouchableOpacity>
      )}

      {discountMultiplier < 1.0 && lowestPrice ? (
        <View style={{ flexDirection: 'column', alignSelf: 'flex-start', marginVertical: 4, width: '100%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.price, { textDecorationLine: 'line-through', fontSize: 11, color: '#94A3B8', marginRight: 6, marginBottom: 0 }]}>
              {lowestPrice} ₺
            </Text>
            <Text style={[styles.price, { color: '#10B981', marginBottom: 0 }]}>
              {discountedPrice} ₺
            </Text>
          </View>
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>%{Math.round((1 - discountMultiplier) * 100)} {user.tier} İskontosu</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.price}>{lowestPrice ? `${lowestPrice} ₺` : 'Fiyat Yok'}</Text>
      )}

      <TouchableOpacity style={styles.addToCartButton} onPress={onAddToCart}>
        <Text style={styles.addToCartButtonText}>Sepete Ekle</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteIcon}>
        <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? '#F97316' : '#64748B'} />
      </TouchableOpacity>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const { addToCart } = useContext(CartContext);
  const { user, setUser } = useContext(AuthContext); // user ve setUser'ı AuthContext'ten alıyoruz
  const [products, setProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [isAuthModalVisible, setAuthModalVisible] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  useEffect(() => {
    const loadProducts = async () => {
      const data = await fetchProducts();
      setProducts(data);
      setFilteredProducts(data);
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (searchQuery === '') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter(product =>
          product.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    setCurrentPage(0);
  }, [searchQuery, products]);

  const handleToggleFavorite = async (item) => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }

    try {
      if (user.favorites.includes(item._id)) {
        await removeFavorite(item._id, user, setUser); // Ürünü favorilerden çıkar
      } else {
        await addFavorite(item._id, user, setUser); // Ürünü favorilere ekle
      }
    } catch (error) {
      console.error('Favori işleme hatası:', error);
    }
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    showToast(`${item.title} sepete eklendi!`, 'success');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const data = await fetchProducts();
    setProducts(data);
    setFilteredProducts(data);
    setRefreshing(false);
  };

  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredProducts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  return (
    <SafeAreaView style={styles.container}>
      {toast.visible && (
        <View style={[styles.toast, styles[`toast_${toast.type}`]]}>
          <Ionicons 
            name={toast.type === 'success' ? 'checkmark-circle' : 'information-circle'} 
            size={20} 
            color="#FFFFFF" 
            style={{ marginRight: 8 }} 
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={isAuthModalVisible}
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="heart" size={40} color="#F97316" style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Giriş Yapmanız Gerekiyor</Text>
            <Text style={styles.modalText}>
              Ürünleri favorilerinize eklemek ve size özel fiyat tekliflerini takip etmek için giriş yapmalısınız.
            </Text>
            <View style={styles.modalButtonGroup}>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setAuthModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalActionButton} 
                onPress={() => {
                  setAuthModalVisible(false);
                  navigation.navigate('Profile');
                }}
              >
                <Text style={styles.modalActionButtonText}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TextInput
        style={styles.searchBar}
        placeholder="Ürün ara..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ flex: 1, alignItems: 'center', marginBottom: 15 }}>
          <Carousel
            loop
            width={carouselWidth}
            height={carouselHeight}
            mode="horizontal-stack"
            modeConfig={{
              stackInterval: 8,
              snapDirection: 'left',
            }}
            autoPlay={true}
            data={imageUrls}
            scrollAnimationDuration={1000}
            onSnapToItem={() => {}}
            renderItem={({ index }) => (
              <View style={styles.carouselItem}>
                <Image source={{ uri: imageUrls[index] }} style={styles.carouselImage} />
              </View>
            )}
          />
        </View>
        <View style={styles.row}>
          {currentItems.map((item) => (
            <View style={styles.column} key={item._id}>
              <Item
                title={item.title}
                image={item.image}
                price={item.price}
                wholesalers={item.wholesalers}
                onAddToCart={() => handleAddToCart(item)}
                onToggleFavorite={() => handleToggleFavorite(item)}
                isFavorite={user?.favorites?.includes(item._id)} // Ürünün favori olup olmadığını kontrol et
                user={user}
                onWholesalerPress={() => {
                  const mainWholesaler = item.wholesalers?.[0];
                  if (mainWholesaler?.usersID) {
                    navigation.navigate('WholesalerDetail', {
                      wholesalerId: mainWholesaler.usersID,
                      wholesalerName: mainWholesaler.name
                    });
                  }
                }}
              />
            </View>
          ))}
        </View>
        <View style={styles.pagination}>
          <TouchableOpacity
            onPress={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
            disabled={currentPage === 0}
            style={[styles.pageButton, currentPage === 0 && styles.disabledButton]}
          >
            <Text style={styles.pageButtonText}>Önceki</Text>
          </TouchableOpacity>
          <Text style={styles.pageNumber}>{currentPage + 1} / {totalPages}</Text>
          <TouchableOpacity
            onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
            disabled={currentPage === totalPages - 1}
            style={[styles.pageButton, currentPage === totalPages - 1 && styles.disabledButton]}
          >
            <Text style={styles.pageButtonText}>Sonraki</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#F8FAFC',
  },
  searchBar: {
    height: 44,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    margin: 10,
    paddingLeft: 12,
    backgroundColor: '#fff',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    fontSize: 14,
    maxWidth: 1000,
    width: isWeb ? '95%' : '95%',
    alignSelf: 'center',
  },
  scrollView: {
    padding: 10,
    paddingBottom: 90,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },
  column: {
    flexBasis: isWeb ? '23%' : '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  item: {
    backgroundColor: '#ffffff',
    padding: 12,
    alignItems: 'center',
    width: '100%',
    borderRadius: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 8,
    borderRadius: 12,
  },
  title: {
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 6,
    fontWeight: 'bold',
    textAlign: 'center',
    height: 40,
  },
  price: {
    fontSize: 16,
    color: '#1E293B', // Koyu Siyah/Antrasit
    marginBottom: 10,
    fontWeight: '700',
  },
  addToCartButton: {
    backgroundColor: '#1E3A8A', // Deep Navy
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addToCartButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  favoriteIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },
  pageButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pageNumber: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  carouselItem: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  toast: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10000,
  },
  toast_info: {
    backgroundColor: '#334155', // Slate Gray
  },
  toast_success: {
    backgroundColor: '#10B981', // Emerald Green
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  modalContent: {
    backgroundColor: '#F8FAFC', // Kırık beyaz / Açık gri arka fon
    padding: 30,
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A', // Mavi başlık
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#475569', // Koyu gri metin
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButtonGroup: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalCloseButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalCloseButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
  modalActionButton: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1E3A8A', // Mavi buton
    alignItems: 'center',
  },
  modalActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  wholesalerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED', // Hafif turuncu zemin
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  wholesalerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F97316', // Koral turuncu metin
  },
  discountBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  discountBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1E3A8A',
  },
});

export default HomeScreen;
