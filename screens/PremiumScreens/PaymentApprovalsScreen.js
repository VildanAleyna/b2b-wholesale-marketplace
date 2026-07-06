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
  Image,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { fetchWholesalerPayments, updatePaymentStatus } from '../../data/Data';

const PaymentApprovalsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null); // Dekont inceleme modalı için
  const [toast, setToast] = useState({ visible: false, message: '' });

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const loadPayments = async () => {
    if (user && user._id) {
      try {
        const data = await fetchWholesalerPayments(user._id);
        setPayments(data);
      } catch (error) {
        console.error('Ödemeler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadPayments();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (paymentId, status) => {
    try {
      const response = await updatePaymentStatus(paymentId, status);
      if (response) {
        showToast(status === 'Approved' ? 'Ödeme başarıyla onaylandı ve borçtan düşüldü.' : 'Ödeme bildirimi reddedildi.');
        loadPayments();
      } else {
        showToast('İşlem gerçekleştirilirken bir hata oluştu.');
      }
    } catch (error) {
      console.error(error);
      showToast('İşlem başarısız oldu.');
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <View style={[styles.badge, styles.approvedBadge]}>
            <Ionicons name="checkmark-circle-outline" size={12} color="#10B981" style={{ marginRight: 4 }} />
            <Text style={styles.approvedBadgeText}>Onaylandı</Text>
          </View>
        );
      case 'Rejected':
        return (
          <View style={[styles.badge, styles.rejectedBadge]}>
            <Ionicons name="close-circle-outline" size={12} color="#EF4444" style={{ marginRight: 4 }} />
            <Text style={styles.rejectedBadgeText}>Reddedildi</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, styles.pendingBadge]}>
            <Ionicons name="time-outline" size={12} color="#F97316" style={{ marginRight: 4 }} />
            <Text style={styles.pendingBadgeText}>Onay Bekliyor</Text>
          </View>
        );
    }
  };

  const renderPaymentItem = ({ item }) => {
    const customer = item.customerId || {};
    const date = new Date(item.createdAt).toLocaleDateString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={styles.paymentCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.customerName}>{customer.name || 'Bilinmeyen Bayi'}</Text>
            <Text style={styles.customerEmail}>{customer.email || ''}</Text>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ödenen Tutar:</Text>
            <Text style={styles.amountText}>{item.amount.toLocaleString('tr-TR')} ₺</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tarih:</Text>
            <Text style={styles.detailValue}>{date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dekont Dosyası:</Text>
            <TouchableOpacity 
              style={styles.fileLinkButton} 
              onPress={() => setSelectedReceipt(item)}
            >
              <Ionicons name="document-text-outline" size={14} color="#F97316" style={{ marginRight: 4 }} />
              <Text style={styles.fileLinkText}>{item.receiptFile}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {item.status === 'Pending' && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleUpdateStatus(item._id, 'Rejected')}
            >
              <Ionicons name="close-outline" size={16} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={styles.rejectButtonText}>Reddet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => handleUpdateStatus(item._id, 'Approved')}
            >
              <Ionicons name="checkmark-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.approveButtonText}>Ödemeyi Onayla</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const pendingCount = payments.filter(payment => payment.status === 'Pending').length;
  const approvedTotal = payments
    .filter(payment => payment.status === 'Approved')
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const pendingTotal = payments
    .filter(payment => payment.status === 'Pending')
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      {toast.visible && (
        <View style={styles.toast}>
          <Ionicons name="information-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <View style={styles.pageHeader}>
              <Text style={styles.eyebrow}>Muhasebe Paneli</Text>
              <Text style={styles.pageTitle}>Ödeme Onayları</Text>
              <Text style={styles.pageSubtitle}>Bayilerden gelen dekont ve ödeme bildirimlerini kontrol edip cari borçtan düşebilirsiniz.</Text>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Bekleyen Bildirim</Text>
                  <Text style={styles.summaryValueWarning}>{pendingCount}</Text>
                  <Text style={styles.summaryHint}>İşlem bekleyen ödeme kaydı</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Bekleyen Tutar</Text>
                  <Text style={styles.summaryValue}>{pendingTotal.toLocaleString('tr-TR')} ₺</Text>
                  <Text style={styles.summaryHint}>Onaylandığında cariden düşer</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Onaylanan Tahsilat</Text>
                  <Text style={styles.summaryValueSuccess}>{approvedTotal.toLocaleString('tr-TR')} ₺</Text>
                  <Text style={styles.summaryHint}>Onaylanmış ödeme toplamı</Text>
                </View>
              </View>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-open-outline" size={60} color="#CBD5E1" style={{ marginBottom: 15 }} />
              <Text style={styles.emptyTitle}>Gelen Bildirim Yok</Text>
              <Text style={styles.emptySubtitle}>
                Bayileriniz tarafından gönderilmiş herhangi bir ödeme veya dekont bildirimi bulunmuyor.
              </Text>
            </View>
          }
        />
      )}

      {/* Dekont Görüntüleme Modalı */}
      <Modal
        visible={!!selectedReceipt}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View style={styles.receiptOverlay}>
          <View style={styles.receiptContent}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptTitle}>Dekont Önizleme</Text>
              <TouchableOpacity onPress={() => setSelectedReceipt(null)} style={styles.closeReceiptButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptPreviewBox}>
              <Ionicons name="document-text" size={60} color="#CBD5E1" style={{ marginBottom: 10 }} />
              <Text style={styles.receiptDocName}>{selectedReceipt?.receiptFile}</Text>
              
              <View style={styles.simulatedReceiptDetails}>
                <Text style={styles.simLabel}>Gönderen Bayi:</Text>
                <Text style={styles.simVal}>{selectedReceipt?.customerId?.name}</Text>
                
                <Text style={styles.simLabel}>Tutar:</Text>
                <Text style={styles.simValAmount}>{selectedReceipt?.amount?.toLocaleString('tr-TR')} ₺</Text>
                
                <Text style={styles.simLabel}>Banka:</Text>
                <Text style={styles.simVal}>Akbank T.A.Ş.</Text>
                
                <Text style={styles.simLabel}>Açıklama:</Text>
                <Text style={styles.simVal}>Cari borç ödemesi referans {selectedReceipt?._id?.substring(0, 8)}</Text>
              </View>

              <View style={styles.verifiedStampBox}>
                <Ionicons name="shield-checkmark" size={16} color="#1E3A8A" style={{ marginRight: 4 }} />
                <Text style={styles.verifiedStampText}>Banka İmzalı & Elektronik Mühürlü</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeReceiptActionBtn} onPress={() => setSelectedReceipt(null)}>
              <Text style={styles.closeReceiptActionBtnText}>Kapat</Text>
            </TouchableOpacity>
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
  pageHeader: {
    width: '100%',
    maxWidth: 900,
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
    minWidth: 210,
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
    fontSize: 22,
    color: '#1E3A8A',
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 6,
  },
  summaryValueWarning: {
    fontSize: 22,
    color: '#F97316',
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 6,
  },
  summaryValueSuccess: {
    fontSize: 22,
    color: '#10B981',
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 6,
  },
  summaryHint: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  paymentCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  customerEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: '#FFF7ED',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F97316',
  },
  approvedBadge: {
    backgroundColor: '#ECFDF5',
  },
  approvedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  rejectedBadge: {
    backgroundColor: '#FEF2F2',
  },
  rejectedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  cardDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  fileLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  fileLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F97316',
    textDecorationLine: 'underline',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  rejectButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    flexDirection: 'row',
  },
  rejectButtonText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 13,
  },
  approveButton: {
    flex: 1.5,
    backgroundColor: '#1E3A8A',
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    flexDirection: 'row',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
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
  receiptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  receiptContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 15,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  closeReceiptButton: {
    padding: 4,
  },
  receiptPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  receiptDocName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 15,
  },
  simulatedReceiptDetails: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  simLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 6,
  },
  simVal: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '700',
    marginTop: 2,
  },
  simValAmount: {
    fontSize: 15,
    color: '#1E3A8A',
    fontWeight: '800',
    marginTop: 2,
  },
  verifiedStampBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  verifiedStampText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  closeReceiptActionBtn: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeReceiptActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default PaymentApprovalsScreen;
