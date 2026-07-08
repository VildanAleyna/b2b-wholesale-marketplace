import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  Platform, 
  TouchableOpacity, 
  Dimensions,
  Modal 
} from 'react-native';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';
import { fetchProducts, addFavorite, removeFavorite } from '../../data/Data';
import { Ionicons } from '@expo/vector-icons';

const isWeb = Platform.OS === 'web';
const width = Dimensions.get('window').width;

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

const CategoryDetailScreen = ({ route, navigation }) => {
  const { category } = route.params;
  const { addToCart } = useContext(CartContext);
  const { user, setUser } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
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
      try {
        const data = await fetchProducts();
        const filteredData = data.filter(product => product.categoryId === category._id);
        setProducts(filteredData);
      } catch (error) {
        showToast("Ürünler yüklenirken bir hata oluştu.", "info");
      }
    };

    loadProducts();
  }, [category]);

  const handleAddToCart = (item) => {
    addToCart(item);
    showToast(`${item.title} sepete eklendi!`, 'success');
  };

  const handleToggleFavorite = async (item) => {
    if (!user) {
      setAuthModalVisible(true);
      return;
    }

    try {
      if (user.favorites.includes(item._id)) {
        await removeFavorite(item._id, user, setUser);
        showToast(`${item.title} favorilerden çıkarıldı.`, 'info');
      } else {
        await addFavorite(item._id, user, setUser);
        showToast(`${item.title} favorilere eklendi.`, 'success');
      }
    } catch (error) {
      console.error('Favori hatası:', error);
    }
  };

  return (
    <View style={styles.container}>
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

      {/* Misafir Giriş Uyarısı Modalı */}
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

      <ScrollView contentContainerStyle={styles.scrollView}>

        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={50} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>Bu kategoride henüz ürün bulunmuyor.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {products.map((item) => (
              <View style={styles.column} key={item._id}>
                <Item
                  title={item.title}
                  image={item.image}
                  price={item.price}
                  wholesalers={item.wholesalers}
                  onAddToCart={() => handleAddToCart(item)}
                  onToggleFavorite={() => handleToggleFavorite(item)}
                  isFavorite={user?.favorites?.includes(item._id)}
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
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    maxWidth: 1280,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A', // Deep Navy
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
    maxWidth: 1280,
  },
  column: {
    width: isWeb ? '23%' : '48%', // Anasayfa ile aynı ızgara tasarımı
    marginHorizontal: '1%',
    marginBottom: 20,
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
    position: 'relative',
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
    color: '#1E293B',
    marginBottom: 10,
    fontWeight: '700',
  },
  addToCartButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
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
    backgroundColor: '#334155',
  },
  toast_success: {
    backgroundColor: '#10B981',
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
    backgroundColor: '#F8FAFC',
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
    color: '#1E3A8A',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#475569',
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
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
  },
  modalActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  wholesalerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  wholesalerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F97316',
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

export default CategoryDetailScreen;
