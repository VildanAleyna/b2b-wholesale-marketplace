import React, { useContext, useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Dimensions,
  RefreshControl,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { fetchWholesalerDetails, fetchUserProducts, addFavorite, removeFavorite } from '../data/Data';

const isWeb = Platform.OS === 'web';
const width = Dimensions.get('window').width;

const ProductItem = ({ price, title, image, onAddToCart, onToggleFavorite, isFavorite, stockQuantity }) => (
  <View style={styles.item}>
    <Image source={{ uri: image }} style={styles.image} />
    <Text style={styles.title} numberOfLines={2}>{title}</Text>
    <View style={styles.priceStockRow}>
      <Text style={styles.price}>{price} ₺</Text>
      <Text style={[styles.stock, stockQuantity < 10 && styles.lowStock]}>Stok: {stockQuantity}</Text>
    </View>
    <TouchableOpacity style={styles.addToCartButton} onPress={onAddToCart}>
      <Text style={styles.addToCartButtonText}>Sepete Ekle</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteIcon}>
      <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? '#F97316' : '#64748B'} />
    </TouchableOpacity>
  </View>
);

const WholesalerDetailScreen = ({ route, navigation }) => {
  const { wholesalerId } = route.params;
  const { addToCart } = useContext(CartContext);
  const { user, setUser } = useContext(AuthContext);

  const [wholesaler, setWholesaler] = useState(null);
  const [products, setProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [isAuthModalVisible, setAuthModalVisible] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const loadData = async () => {
    try {
      // 1. Toptancı bilgilerini al
      const info = await fetchWholesalerDetails(wholesalerId);
      setWholesaler(info);

      // 2. Toptancının sattığı ürünleri al
      const items = await fetchUserProducts(wholesalerId);
      setProducts(items);
    } catch (error) {
      console.error('Toptancı detay yükleme hatası:', error);
      showToast('Bilgiler yüklenirken bir hata oluştu.', 'info');
    }
  };

  useEffect(() => {
    loadData();
  }, [wholesalerId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddToCart = (item) => {
    const cartItem = {
      ...item,
      selectedWholesalerId: wholesalerId,
      price: item.wholesalers?.find(w => w.usersID === wholesalerId)?.price || item.price
    };
    const result = addToCart(cartItem);
    if (!result.ok) {
      showToast(result.message, 'info');
      return;
    }
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

      {/* Giriş Uyarısı Modalı */}
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
              Ürünleri favorilerinize eklemek ve size özel teklifleri takip etmek için giriş yapmalısınız.
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

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Toptancı Profil Kartı */}
        {wholesaler && (
          <View style={styles.profileCard}>
            <View style={styles.profileMain}>
              <View style={styles.shopBadge}>
                <Ionicons name="business" size={32} color="#1E3A8A" />
              </View>
              <View style={styles.shopInfo}>
                <Text style={styles.shopName}>{wholesaler.name}</Text>
                <Text style={styles.shopTaxNo}>Vergi Dairesi & No: {wholesaler.taxNumber}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.contactDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="call" size={16} color="#64748B" style={styles.detailIcon} />
                <Text style={styles.detailText}>{wholesaler.phone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="mail" size={16} color="#64748B" style={styles.detailIcon} />
                <Text style={styles.detailText}>{wholesaler.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="pin" size={16} color="#64748B" style={styles.detailIcon} />
                <Text style={styles.detailText}>{wholesaler.address}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Ürün Listesi Başlığı */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Mağaza Ürünleri</Text>
          <Text style={styles.listCount}>({products.length} Ürün Mevcut)</Text>
        </View>

        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={50} color="#CBD5E1" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>Bu toptancının henüz vitrinde ürünü bulunmuyor.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {products.map((item) => {
              // Toptancının kendi fiyat ve stok bilgilerini bul
              const selfInfo = item.wholesalers?.find(w => w.usersID === wholesalerId) || {};
              const price = selfInfo.price || item.price;
              const stock = selfInfo.stockQuantity || 0;

              return (
                <View style={styles.column} key={item._id}>
                  <ProductItem
                    title={item.title}
                    image={item.image}
                    price={price}
                    stockQuantity={stock}
                    onAddToCart={() => handleAddToCart(item)}
                    onToggleFavorite={() => handleToggleFavorite(item)}
                    isFavorite={user?.favorites?.includes(item._id)}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: isWeb ? 140 : 110,
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 1280,
    marginBottom: 30,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  shopBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  shopTaxNo: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 20,
  },
  contactDetails: {
    paddingHorizontal: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailIcon: {
    marginRight: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  listHeader: {
    width: '100%',
    maxWidth: 1280,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  listCount: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 8,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
    maxWidth: 1280,
  },
  column: {
    width: isWeb ? '23%' : '48%',
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
    fontSize: 13,
    color: '#1E293B',
    marginBottom: 6,
    fontWeight: 'bold',
    textAlign: 'center',
    height: 40,
  },
  priceStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  price: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '700',
  },
  stock: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  lowStock: {
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
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
    fontSize: 14,
    color: '#64748B',
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
});

export default WholesalerDetailScreen;
