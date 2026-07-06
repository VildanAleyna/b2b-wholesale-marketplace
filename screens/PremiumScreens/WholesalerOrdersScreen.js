import React, { useState, useEffect, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { fetchWholesalerOrders, updateOrderStatus } from '../../data/Data';
import { EMPLOYEE_ROLES } from '../../constants/roles';

const WholesalerOrdersScreen = () => {
  const { user } = useContext(AuthContext);
  const isSalesEmployee = user?.employeeAccount && user?.employeeRole === EMPLOYEE_ROLES.SALES;
  const canOperateShipment = !user?.employeeAccount || user?.employeeRole === EMPLOYEE_ROLES.WAREHOUSE;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  // Kargo Bildirim Modalı Eyaletleri
  const [isShipModalVisible, setShipModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingNo, setTrackingNo] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const loadOrders = async () => {
    if (user && user._id) {
      try {
        const data = await fetchWholesalerOrders(user._id);
        setOrders(data);
      } catch (error) {
        console.error('Gelen siparişler yüklenemedi:', error);
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
  // Siparişi Hazırlamaya Başla (Preparing Güncellemesi)
  const handlePrepareOrder = async (order) => {
    setIsUpdating(true);
    try {
      const response = await updateOrderStatus(
        order.customerId,
        order.orderId,
        'Preparing',
        ''
      );
      if (response) {
        showToast('Sipariş hazırlanıyor durumuna alındı! 📦');
        await loadOrders();
      }
    } catch (error) {
      console.error(error);
      showToast('Güncelleme sırasında hata oluştu.');
    } finally {
      setIsUpdating(false);
    }
  };
  // Kargolama Modalını Aç
  const handleOpenShipModal = (order) => {
    setSelectedOrder(order);
    setTrackingNo('');
    setShipModalVisible(true);
  };

  // Kargo Gönderimi (Shipped Güncellemesi)
  const handleShipOrder = async () => {
    if (!selectedOrder) return;
    if (!trackingNo.trim()) {
      showToast('Lütfen kargo takip numarasını giriniz.');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await updateOrderStatus(
        selectedOrder.customerId,
        selectedOrder.orderId,
        'Shipped',
        trackingNo
      );

      if (response) {
        showToast('Sipariş kargoya verildi olarak güncellendi! 📦');
        setShipModalVisible(false);
        await loadOrders();
      }
    } catch (error) {
      console.error(error);
      showToast('Güncelleme sırasında hata oluştu.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Teslim Edildi Güncellemesi (Delivered)
  const handleDeliverOrder = async (order) => {
    const performDelivery = async () => {
      try {
        const response = await updateOrderStatus(
          order.customerId,
          order.orderId,
          'Delivered',
          order.trackingNumber
        );
        if (response) {
          showToast('Sipariş teslim edildi olarak işaretlendi! ✅');
          await loadOrders();
        }
      } catch (error) {
        console.error(error);
        showToast('İşlem tamamlanamadı.');
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm('Siparişin bayiye başarıyla ulaştığını ve teslim edildiğini onaylıyor musunuz?');
      if (confirm) {
        await performDelivery();
      }
    } else {
      Alert.alert(
        'Teslimatı Onayla',
        `Siparişin bayiye başarıyla ulaştığını ve teslim edildiğini onaylıyor musunuz?`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Evet, Teslim Edildi', style: 'default', onPress: performDelivery }
        ]
      );
    }
  };

  const renderOrderItem = ({ item }) => {
    const date = new Date(item.date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isCari = item.paymentMethod === 'Cari';
    
    const statusText = item.status === 'Pending'
      ? 'Sipariş Alındı'
      : item.status === 'Preparing'
        ? 'Hazırlanıyor'
        : item.status === 'Shipped'
          ? 'Kargoya Verildi'
          : 'Teslim Edildi';

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

    return (
      <View style={styles.orderCard}>
        {/* Başlık Bölümü */}
        <View style={styles.orderHeader}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.orderEmail}>{item.customerEmail}</Text>
            <Text style={styles.orderDate}>{date}</Text>
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Toplam Sipariş</Text>
            <Text style={styles.totalVal}>{item.totalAmount.toLocaleString('tr-TR')} ₺</Text>
            <View style={[styles.paymentBadge, isCari ? styles.cariBadge : styles.ccBadge]}>
              <Text style={[styles.paymentBadgeText, isCari ? styles.cariBadgeText : styles.ccBadgeText]}>
                {isCari ? 'Cari Hesap' : 'Kredi Kartı'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sipariş Ürünleri */}
        <View style={styles.productsContainer}>
          {item.products.map((product, idx) => (
            <View key={product.productId || idx} style={styles.productRow}>
              {product.image && (
                <Image source={{ uri: product.image }} style={styles.productImage} />
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
                <View style={styles.productMeta}>
                  <Text style={styles.productPrice}>{product.price.toLocaleString('tr-TR')} ₺</Text>
                  <Text style={styles.productQty}>x {product.count}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Durum ve Lojistik Lojman Paneli */}
        <View style={styles.fulfillmentRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusBadgeColor }]}>
            <Text style={[styles.statusText, { color: statusTextColor }]}>{statusText}</Text>
          </View>

          {item.trackingNumber ? (
            <View style={styles.trackingBox}>
              <Text style={styles.trackingLabel}>Takip No:</Text>
              <Text style={styles.trackingVal}>{item.trackingNumber}</Text>
            </View>
          ) : null}
        </View>

        {/* Aksiyon Butonları */}
        <View style={styles.actionsBox}>
          {isSalesEmployee && (
            <View style={styles.salesActionPanel}>
              <View style={styles.salesActionHeader}>
                <Ionicons name="person-circle-outline" size={18} color="#1E3A8A" style={{ marginRight: 6 }} />
                <Text style={styles.salesActionTitle}>Satış Takip Notu</Text>
              </View>
              <Text style={styles.salesActionText}>
                {item.customerName} için sipariş durumu "{statusText}". Bayi iletişimi ve sipariş takibi satış sorumluluğundadır; lojistik aksiyonlar depo ekibindedir.
              </Text>
              <View style={styles.salesInfoGrid}>
                <View style={styles.salesInfoBox}>
                  <Text style={styles.salesInfoLabel}>Bayi</Text>
                  <Text style={styles.salesInfoValue}>{item.customerEmail || 'E-posta yok'}</Text>
                </View>
                <View style={styles.salesInfoBox}>
                  <Text style={styles.salesInfoLabel}>Sipariş Tutarı</Text>
                  <Text style={styles.salesInfoValue}>{item.totalAmount.toLocaleString('tr-TR')} ₺</Text>
                </View>
              </View>
            </View>
          )}

          {canOperateShipment && (
            <>
              {item.status === 'Pending' && (
                <TouchableOpacity 
                  style={styles.prepareBtn}
                  onPress={() => handlePrepareOrder(item)}
                  disabled={isUpdating}
                >
                  <Ionicons name="time-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.prepareBtnText}>Hazırlanmaya Başla</Text>
                </TouchableOpacity>
              )}

              {item.status === 'Preparing' && (
                <TouchableOpacity 
                  style={styles.shipBtn}
                  onPress={() => handleOpenShipModal(item)}
                >
                  <Ionicons name="airplane-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.shipBtnText}>Kargoya Ver (Takip No Gir)</Text>
                </TouchableOpacity>
              )}

              {item.status === 'Shipped' && (
                <TouchableOpacity 
                  style={styles.deliverBtn}
                  onPress={() => handleDeliverOrder(item)}
                >
                  <Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.deliverBtnText}>Kargo Raporuna Göre Teslim Et</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {item.status === 'Delivered' && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.completedBadgeText}>Sipariş Tamamlandı</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const pendingOrders = orders.filter(order => order.status === 'Pending').length;
  const activeOrders = orders.filter(order => ['Pending', 'Preparing', 'Shipped'].includes(order.status)).length;
  const totalSalesAmount = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const uniqueCustomers = new Set(orders.map(order => order.customerId || order.customerEmail)).size;

  return (
    <SafeAreaView style={styles.container}>
      {toast.visible && (
        <View style={styles.toast}>
          <Ionicons name="information-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <View style={styles.pageHeader}>
              <Text style={styles.eyebrow}>{isSalesEmployee ? 'Satış Takip Paneli' : 'Operasyon Paneli'}</Text>
              <Text style={styles.pageTitle}>{isSalesEmployee ? 'Bayi Sipariş Takibi' : 'Gelen Siparişler'}</Text>
              <Text style={styles.pageSubtitle}>
                {isSalesEmployee
                  ? 'Bayilerin sipariş durumunu, tutarlarını ve müşteri takibini buradan izleyin.'
                  : 'Bayilerden gelen siparişleri hazırlama, kargo ve teslimat sürecinde yönetin.'}
              </Text>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Aktif Sipariş</Text>
                  <Text style={styles.summaryValue}>{activeOrders}</Text>
                  <Text style={styles.summaryHint}>Tamamlanmamış sipariş</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Yeni Sipariş</Text>
                  <Text style={styles.summaryValueWarning}>{pendingOrders}</Text>
                  <Text style={styles.summaryHint}>İşlem bekleyen kayıt</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Toplam Tutar</Text>
                  <Text style={styles.summaryValueSmall}>{totalSalesAmount.toLocaleString('tr-TR')} ₺</Text>
                  <Text style={styles.summaryHint}>Listelenen sipariş toplamı</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Bayi Sayısı</Text>
                  <Text style={styles.summaryValue}>{uniqueCustomers}</Text>
                  <Text style={styles.summaryHint}>Sipariş veren bayi</Text>
                </View>
              </View>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="cube-outline" size={70} color="#CBD5E1" style={{ marginBottom: 15 }} />
              <Text style={styles.emptyTitle}>Gelen Sipariş Bulunmuyor</Text>
              <Text style={styles.emptySubtitle}>
                Bayileriniz henüz sizden cari limit veya kredi kartı ile sipariş oluşturmamış.
              </Text>
            </View>
          }
        />
      )}

      {/* Kargo Takip No Girme Modalı */}
      <Modal
        visible={isShipModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShipModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kargo Takip No Girişi</Text>
              <TouchableOpacity onPress={() => setShipModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Taşıyıcı Kargo Firması / Takip Numarası</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: Yurtiçi Kargo - 834928349"
                value={trackingNo}
                onChangeText={setTrackingNo}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => setShipModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmShipBtn}
                onPress={handleShipOrder}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmShipBtnText}>Kargola</Text>
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
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
    alignItems: 'center',
  },
  pageHeader: {
    width: Platform.OS === 'web' ? 850 : '100%',
    maxWidth: 850,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  summaryCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 6,
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '800',
  },
  summaryValue: {
    fontSize: 24,
    color: '#1E3A8A',
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValueWarning: {
    fontSize: 24,
    color: '#F97316',
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValueSmall: {
    fontSize: 18,
    color: '#1E3A8A',
    fontWeight: '900',
    marginTop: 11,
    marginBottom: 7,
  },
  summaryHint: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
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
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 15,
    marginBottom: 15,
  },
  customerName: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  orderEmail: {
    fontSize: Platform.OS === 'web' ? 13 : 11,
    color: '#64748B',
    marginTop: 2,
  },
  orderDate: {
    fontSize: Platform.OS === 'web' ? 13.5 : 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  totalBox: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  totalVal: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontWeight: '900',
    color: '#1E3A8A',
    marginVertical: 2,
  },
  paymentBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  cariBadge: {
    backgroundColor: '#EFF6FF',
  },
  ccBadge: {
    backgroundColor: '#F0FDF4',
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cariBadgeText: {
    color: '#1E3A8A',
  },
  ccBadgeText: {
    color: '#16A34A',
  },
  productsContainer: {
    marginBottom: 15,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  productImage: {
    width: Platform.OS === 'web' ? 68 : 40,
    height: Platform.OS === 'web' ? 68 : 40,
    borderRadius: 6,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  productPrice: {
    fontSize: Platform.OS === 'web' ? 13.5 : 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  productQty: {
    fontSize: Platform.OS === 'web' ? 13.5 : 12,
    fontWeight: '700',
    color: '#64748B',
  },
  fulfillmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  trackingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trackingLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    marginRight: 4,
  },
  trackingVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  actionsBox: {
    width: '100%',
  },
  salesActionPanel: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 14,
  },
  salesActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  salesActionTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  salesActionText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  salesInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  salesInfoBox: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 4,
    marginTop: 4,
  },
  salesInfoLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '800',
    marginBottom: 4,
  },
  salesInfoValue: {
    fontSize: 12.5,
    color: '#1E293B',
    fontWeight: '800',
  },
  prepareBtn: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  prepareBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: Platform.OS === 'web' ? 14.5 : 13,
  },
  shipBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  shipBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  deliverBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  deliverBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  completedBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 150,
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
  toast: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
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
  toastText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
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
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalBody: {
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
    fontSize: 14,
    color: '#1E293B',
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
  confirmShipBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmShipBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default WholesalerOrdersScreen;
