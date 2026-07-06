import React, { useState, useEffect, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { fetchUserOrders, submitOrderRating, updateOrderStatus } from '../data/Data';

const OrderHistoryScreen = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Değerlendirme Modalı Eyaletleri
  const [isRateModalVisible, setRateModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Müşterinin (Bayi) "Siparişi Teslim Aldım" Onayı
  const handleConfirmDelivery = async (order) => {
    const performDelivery = async () => {
      try {
        const response = await updateOrderStatus(
          user._id,
          order._id,
          'Delivered',
          order.trackingNumber
        );
        if (response) {
          if (Platform.OS === 'web') {
            window.alert('Siparişinizi teslim aldığınızı onayladınız. Şimdi toptancıyı değerlendirebilirsiniz. 😊');
          } else {
            Alert.alert('Teslimat Onaylandı!', 'Siparişinizi teslim aldığınızı onayladınız. Şimdi toptancıyı değerlendirebilirsiniz. 😊');
          }
          await loadOrders();
        }
      } catch (error) {
        console.error(error);
        if (Platform.OS === 'web') {
          window.alert('İşlem sırasında bir hata oluştu.');
        } else {
          Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm('Siparişi teslim aldığınızı ve süreci tamamlamak istediğinizi onaylıyor musunuz?');
      if (confirm) {
        await performDelivery();
      }
    } else {
      Alert.alert(
        'Siparişi Teslim Aldım',
        'Siparişi sorunsuzca teslim aldığınızı onaylıyor musunuz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Evet, Teslim Aldım', style: 'default', onPress: performDelivery }
        ]
      );
    }
  };

  const handleOpenRateModal = (order) => {
    setSelectedOrder(order);
    setRatingVal(5);
    setReviewText('');
    setRateModalVisible(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      const response = await submitOrderRating(
        user._id,
        selectedOrder._id,
        ratingVal,
        reviewText
      );
      if (response) {
        Alert.alert('Teşekkürler!', 'Değerlendirmeniz başarıyla toptancıya iletildi. 🎉');
        setRateModalVisible(false);
        await loadOrders();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Değerlendirme gönderilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadOrders = async () => {
    if (user && user._id) {
      try {
        const data = await fetchUserOrders(user._id);
        setOrders(data);
      } catch (error) {
        console.error('Sipariş geçmişi yüklenemedi:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const renderOrderItem = ({ item }) => {
    const date = new Date(item.date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const paymentMethodText = item.paymentMethod === 'Cari' ? 'Cari Hesap' : 'Kredi Kartı';
    const paymentIcon = item.paymentMethod === 'Cari' ? 'wallet' : 'card';

    const statusText = item.status === 'Pending'
      ? 'Sipariş Alındı'
      : item.status === 'Preparing'
        ? 'Hazırlanıyor'
        : item.status === 'Shipped'
          ? 'Kargoya Verildi'
          : 'Teslim Edildi';
        
    const statusIcon = item.status === 'Pending'
      ? 'mail-unread-outline'
      : item.status === 'Preparing'
        ? 'time-outline'
        : item.status === 'Shipped'
          ? 'airplane-outline'
          : 'checkmark-done-circle-outline';

    const statusBadgeColor = item.status === 'Pending'
      ? '#F1F5F9'
      : item.status === 'Preparing'
        ? '#FFFBEB'
        : item.status === 'Shipped'
          ? '#EFF6FF'
          : '#ECFDF5';

    const statusTextColor = item.status === 'Pending'
      ? '#64748B'
      : item.status === 'Preparing'
        ? '#D97706'
        : item.status === 'Shipped'
          ? '#2563EB'
          : '#10B981';

    const statusBorderColor = item.status === 'Pending'
      ? '#E2E8F0'
      : item.status === 'Preparing'
        ? '#FDE68A'
        : item.status === 'Shipped'
          ? '#BFDBFE'
          : '#A7F3D0';

    return (
      <View style={styles.orderCard}>
        {/* Sipariş Başlığı */}
        <View style={styles.orderHeader}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.orderDate}>{date}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
              <View style={styles.paymentMethodBadge}>
                <Ionicons name={paymentIcon} size={12} color="#1E3A8A" style={{ marginRight: 4 }} />
                <Text style={styles.paymentMethodText}>{paymentMethodText}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusBadgeColor, borderColor: statusBorderColor }]}>
                <Ionicons name={statusIcon} size={11} color={statusTextColor} style={{ marginRight: 4 }} />
                <Text style={[styles.statusText, { color: statusTextColor }]}>{statusText}</Text>
              </View>
            </View>
            {item.trackingNumber ? (
              <View style={styles.trackingBox}>
                <Ionicons name="gift-outline" size={12} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.trackingLabel}>Takip No:</Text>
                <Text style={styles.trackingVal}>{item.trackingNumber}</Text>
              </View>
            ) : null}
            <Text style={styles.wholesalerNameText}>
              🏢 Tedarikçi: {item.wholesalerName || 'Toptancı Mağazası'}
            </Text>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Toplam Tutar</Text>
            <Text style={styles.orderTotal}>{item.totalAmount.toLocaleString('tr-TR')} ₺</Text>
          </View>
        </View>

        {/* Sipariş Edilen Ürünler */}
        <View style={styles.productsList}>
          {(item.products || []).map((product, idx) => (
            <View key={product.productId || idx} style={styles.productRow}>
              {product.image ? (
                <Image source={{ uri: product.image }} style={styles.productImage} />
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <Ionicons name="image-outline" size={20} color="#CBD5E1" />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
                <View style={styles.priceQtyRow}>
                  <Text style={styles.productPrice}>{product.price.toLocaleString('tr-TR')} ₺</Text>
                  <Text style={styles.productQuantity}>x {product.count}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Değerlendirme Bölümü (Sadece teslim edilmişse) */}
        {item.status === 'Delivered' && (
          <View style={styles.ratingSection}>
            {item.rating && item.rating > 0 ? (
              <View style={styles.completedRatingBox}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons 
                      key={s} 
                      name={s <= item.rating ? "star" : "star-outline"} 
                      size={14} 
                      color="#F59E0B" 
                    />
                  ))}
                  <Text style={styles.completedRatingText}>({item.rating}/5 Puan Verildi)</Text>
                </View>
                {item.review ? (
                  <Text style={styles.completedReviewText}>"{item.review}"</Text>
                ) : null}
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.rateBtn}
                onPress={() => handleOpenRateModal(item)}
              >
                <Ionicons name="star-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.rateBtnText}>Toptancıyı Değerlendir</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Kargolanmışsa Teslim Al Onayı (Bayi Tarafı) */}
        {item.status === 'Shipped' && (
          <View style={styles.deliveryConfirmationSection}>
            <TouchableOpacity 
              style={styles.confirmDeliveryBtn}
              onPress={() => handleConfirmDelivery(item)}
            >
              <Ionicons name="checkbox-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.confirmDeliveryBtnText}>Siparişi Teslim Aldım</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id || item.date}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={65} color="#CBD5E1" style={{ marginBottom: 15 }} />
              <Text style={styles.emptyTitle}>Sipariş Geçmişiniz Boş</Text>
              <Text style={styles.emptySubtitle}>
                Henüz herhangi bir sipariş vermediniz. Sepetinize ürün ekleyip alışverişi tamamlayabilirsiniz.
              </Text>
            </View>
          }
        />
      )}

      {/* Toptancı Puanlama Modalı */}
      <Modal
        visible={isRateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="star" size={22} color="#F59E0B" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Tedarikçiyi Değerlendir</Text>
              </View>
              <TouchableOpacity onPress={() => setRateModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalIntroText}>
                🏢 <Text style={{ fontWeight: '800' }}>{selectedOrder?.wholesalerName || 'Toptancı Mağazası'}</Text> firmasından aldığınız hizmeti puanlayın:
              </Text>

              {/* Tıklanabilir Yıldız Seçimi */}
              <View style={styles.starSelectorRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity 
                    key={star} 
                    onPress={() => setRatingVal(star)}
                    style={{ padding: 6 }}
                  >
                    <Ionicons 
                      name={star <= ratingVal ? "star" : "star-outline"} 
                      size={36} 
                      color="#F59E0B" 
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Görüş ve Değerlendirmeniz (Opsiyonel)</Text>
              <TextInput
                style={styles.textInput}
                multiline={true}
                numberOfLines={3}
                placeholder="Toptancının hızı, paketleme kalitesi vb. hakkında yorum yazın..."
                value={reviewText}
                onChangeText={setReviewText}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => setRateModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.submitRateBtn}
                onPress={handleSubmitRating}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitRateBtnText}>Değerlendirmeyi Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
    alignItems: 'center',
  },
  orderCard: {
    width: Platform.OS === 'web' ? 850 : '100%',
    maxWidth: 850,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 15,
    marginBottom: 15,
  },
  orderDate: {
    fontSize: Platform.OS === 'web' ? 15.5 : 14,
    fontWeight: '700',
    color: '#334155',
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  orderTotal: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontWeight: '800',
    color: '#1E2937',
  },
  productsList: {
    width: '100%',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  productImage: {
    width: Platform.OS === 'web' ? 68 : 48,
    height: Platform.OS === 'web' ? 68 : 48,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  noImagePlaceholder: {
    width: Platform.OS === 'web' ? 68 : 48,
    height: Platform.OS === 'web' ? 68 : 48,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: Platform.OS === 'web' ? 14.5 : 13,
    fontWeight: '700',
    color: '#334155',
    lineHeight: Platform.OS === 'web' ? 18 : 16,
  },
  priceQtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  productPrice: {
    fontSize: Platform.OS === 'web' ? 13.5 : 12,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  productQuantity: {
    fontSize: Platform.OS === 'web' ? 13.5 : 12,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    maxWidth: 400,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trackingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trackingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 4,
  },
  trackingVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  wholesalerNameText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deliveryConfirmationSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 5,
    width: '100%',
  },
  confirmDeliveryBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  confirmDeliveryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  ratingSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 5,
    width: '100%',
  },
  rateBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  rateBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  completedRatingBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    marginLeft: 6,
  },
  completedReviewText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#B45309',
    marginTop: 6,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 15,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalIntroText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 15,
  },
  starSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 13.5,
    color: '#1E293B',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },
  submitRateBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitRateBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default OrderHistoryScreen;
