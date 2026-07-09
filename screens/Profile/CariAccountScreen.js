import React, { useContext, useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { fetchUserCariAccounts, submitPaymentNotification, fetchUserStatement } from '../../data/Data';
import AppToast from '../../components/ui/AppToast';

const CariAccountScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [accounts, setAccounts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const [isPayModalVisible, setPayModalVisible] = useState(false);
  const [isStatementModalVisible, setStatementModalVisible] = useState(false);
  const [statementRows, setStatementRows] = useState([]);
  const [isStatementLoading, setStatementLoading] = useState(false);

  const handleOpenStatementModal = async (account) => {
    setStatementModalVisible(true);
    setStatementLoading(true);
    try {
      const data = await fetchUserStatement(user._id, account?.wholesalerId?._id);
      setStatementRows(data);
    } catch (error) {
      console.error('Ekstre döküm hatası:', error);
    } finally {
      setStatementLoading(false);
    }
  };
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 2500);
  };

  const loadAccounts = async () => {
    if (user) {
      try {
        const cariData = await fetchUserCariAccounts(user._id);
        setAccounts(cariData);
      } catch (error) {
        console.error('Cari hesaplar yüklenirken hata:', error);
      }
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  };

  const handleOpenPayModal = (account) => {
    setSelectedAccount(account);
    setPayAmount(String(account.currentDebt || 0));
    setReceiptFileName('');
    setPayModalVisible(true);
  };

  const handleSimulateSelectFile = () => {
    const mockFileNames = [
      'dekont_havale_akbank_1283.pdf',
      'yapi_kredi_dekont_9084.jpg',
      'garanti_transfer_dekont.pdf'
    ];
    const randomIndex = Math.floor(Math.random() * mockFileNames.length);
    setReceiptFileName(mockFileNames[randomIndex]);
    showToast('Dekont dosyası başarıyla seçildi!');
  };

  const handleSendNotification = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      showToast('Lütfen geçerli bir ödeme tutarı giriniz.');
      return;
    }
    if (!receiptFileName) {
      showToast('Lütfen banka transfer dekontunu yükleyin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitPaymentNotification(
        user._id,
        selectedAccount.wholesalerId._id,
        amount,
        receiptFileName
      );

      if (response) {
        setPayModalVisible(false);
        showToast('Ödeme bildiriminiz iletildi. Onay bekliyor.');
        loadAccounts();
      } else {
        showToast('Ödeme bildirimi gönderilirken sunucu hatası oluştu.');
      }
    } catch (error) {
      console.error(error);
      showToast('Ödeme bildirimi gönderilemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppToast visible={toast.visible} message={toast.message} />

      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cari Hesap Durumu</Text>
          <Text style={styles.headerSubtitle}>
            Toptancılarla olan borç, alacak ve açık hesap limitlerinizi buradan takip edebilirsiniz.
          </Text>
        </View>

        {accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#CBD5E1" style={{ marginBottom: 15 }} />
            <Text style={styles.emptyTitle}>Aktif Cari Hesap Yok</Text>
            <Text style={styles.emptySubtitle}>
              Herhangi bir toptancıda adınıza tanımlanmış aktif bir limit veya borç kaydı bulunmuyor.
            </Text>
          </View>
        ) : (
          accounts.map((item, index) => {
            const wholesaler = item.wholesalerId || {};
            const limit = item.creditLimit || 0;
            const debt = item.currentDebt || 0;
            const remaining = limit - debt;
            
            // Limit doluluk oranı yüzdesi
            const percent = limit > 0 ? Math.min(Math.round((debt / limit) * 100), 100) : 0;
            const isHighDebt = percent > 80;

            return (
              <View key={item._id || index} style={styles.accountCard}>
                {/* Toptancı Başlığı */}
                <View style={styles.cardHeader}>
                  <View style={styles.wholesalerInfo}>
                    <Ionicons name="business-outline" size={24} color="#1E3A8A" style={{ marginRight: 10 }} />
                    <View>
                      <Text style={styles.wholesalerName}>{wholesaler.name || 'Toptancı Mağazası'}</Text>
                      <Text style={styles.taxNo}>Vergi No: {wholesaler.taxNumber || 'Belirtilmemiş'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.detailLink}
                    onPress={() => {
                      if (wholesaler._id) {
                        navigation.navigate('WholesalerDetail', { wholesalerId: wholesaler._id });
                      }
                    }}
                  >
                    <Text style={styles.detailLinkText}>Mağazayı Gör</Text>
                    <Ionicons name="arrow-forward-outline" size={14} color="#F97316" />
                  </TouchableOpacity>
                </View>

                {/* İletişim Bilgileri */}
                <View style={styles.contactDetails}>
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={styles.contactText}>{wholesaler.phone || 'Telefon yok'}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="pin-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={styles.contactText} numberOfLines={1}>{wholesaler.address || 'Adres yok'}</Text>
                  </View>
                </View>

                {/* Cari Bilgileri */}
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>KREDİ LİMİTİ</Text>
                    <Text style={[styles.statValue, styles.limitColor]}>{limit.toLocaleString('tr-TR')} ₺</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>GÜNCEL BORÇ</Text>
                    <Text style={[styles.statValue, styles.debtColor]}>{debt.toLocaleString('tr-TR')} ₺</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>KALAN LİMİT</Text>
                    <Text style={[styles.statValue, styles.remainingColor]}>{remaining.toLocaleString('tr-TR')} ₺</Text>
                  </View>
                </View>

                {/* Limit İlerleme Çubuğu */}
                <View style={styles.progressSection}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>Limit Kullanım Oranı</Text>
                    <Text style={[styles.progressVal, isHighDebt && styles.highDebtText]}>%{percent}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${percent}%` },
                        isHighDebt && styles.highDebtFill
                      ]} 
                    />
                  </View>
                </View>

                {/* Aksiyon Butonları */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.paymentButton} 
                    onPress={() => handleOpenPayModal(item)}
                  >
                    <Ionicons name="wallet-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.paymentButtonText}>Borç Ödeme Yap</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.ledgerButton}
                    onPress={() => handleOpenStatementModal(item)}
                  >
                    <Ionicons name="document-text-outline" size={16} color="#1E3A8A" style={{ marginRight: 6 }} />
                    <Text style={styles.ledgerButtonText}>Ekstre İndir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* EFT/Havale Bildirim Modalı */}
      <Modal
        visible={isPayModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="wallet-outline" size={22} color="#1E3A8A" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Havale / EFT Ödeme Bildirimi</Text>
              </View>
              <TouchableOpacity onPress={() => setPayModalVisible(false)} style={styles.modalCloseIcon}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.bankInfoBox}>
                <Text style={styles.bankInfoTitle}>🏦 Toptancı Banka Bilgileri</Text>
                
                <Text style={styles.bankDetailLabel}>Alıcı Ünvanı:</Text>
                <Text style={styles.bankDetailValue}>{selectedAccount?.wholesalerId?.name || 'Tedarikçi'}</Text>
                
                <Text style={styles.bankDetailLabel}>Banka Adı:</Text>
                <Text style={styles.bankDetailValue}>Akbank T.A.Ş. - İstoç Ticari Şubesi</Text>
                
                <Text style={styles.bankDetailLabel}>IBAN Numarası:</Text>
                <View style={styles.ibanRow}>
                  <Text style={styles.bankDetailValueIBAN}>TR87 0004 6000 1234 5678 9012 34</Text>
                </View>
                <Text style={styles.bankWarningText}>* Lütfen banka transferini yukarıdaki IBAN'a yaptıktan sonra ödeme bildirimini gönderiniz.</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Ödeme Tutarı (₺)</Text>
                <TextInput
                  style={styles.textInput}
                  value={payAmount}
                  onChangeText={setPayAmount}
                  keyboardType="numeric"
                  placeholder="Örn: 15.000"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Banka Dekont Belgesi</Text>
                <TouchableOpacity style={styles.filePickerButton} onPress={handleSimulateSelectFile}>
                  <Ionicons name="document-attach-outline" size={18} color="#F97316" style={{ marginRight: 6 }} />
                  <Text style={styles.filePickerText} numberOfLines={1}>
                    {receiptFileName ? receiptFileName : 'Dosya Seç / Dekont Yükle'}
                  </Text>
                </TouchableOpacity>
                {receiptFileName ? (
                  <View style={styles.fileSelectedLabel}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
                    <Text style={styles.fileSelectedText}>Dekont başarıyla yüklendi (Onay bekliyor)</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.modalButtonGroup}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setPayModalVisible(false)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.modalCancelButtonText}>İptal Et</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalSubmitButton}
                  onPress={handleSendNotification}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitButtonText}>Bildirimi Gönder</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Cari Ekstre Detay Tablosu Modalı */}
      <Modal
        visible={isStatementModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStatementModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.statementModalContent]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="document-text" size={22} color="#1E3A8A" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Cari Hesap Ekstresi</Text>
              </View>
              <TouchableOpacity onPress={() => setStatementModalVisible(false)} style={styles.modalCloseIcon}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {isStatementLoading ? (
              <View style={styles.statementLoadingBox}>
                <ActivityIndicator size="large" color="#1E3A8A" />
                <Text style={styles.statementLoadingText}>Hesap hareketleri derleniyor...</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {statementRows.length === 0 ? (
                  <View style={styles.emptyStatementBox}>
                    <Ionicons name="folder-open-outline" size={50} color="#CBD5E1" style={{ marginBottom: 12 }} />
                    <Text style={styles.emptyStatementText}>Henüz işlem kaydı bulunamadı.</Text>
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    <ScrollView style={styles.statementTableContainer}>
                      {/* Tablo Başlıkları */}
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableHeaderCol, { flex: 2 }]}>Tarih</Text>
                        <Text style={[styles.tableHeaderCol, { flex: 3 }]}>İşlem / Açıklama</Text>
                        <Text style={[styles.tableHeaderCol, { flex: 2, textAlign: 'right' }]}>Tutar</Text>
                      </View>

                      {/* Tablo Satırları */}
                      {statementRows.map((row, idx) => {
                        const dateFormatted = new Date(row.date).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        });

                        const isCredit = row.effect === 'credit';

                        return (
                          <View key={row._id || idx} style={styles.tableBodyRow}>
                            <Text style={[styles.tableBodyCol, { flex: 2, fontSize: 11, color: '#64748B' }]}>{dateFormatted}</Text>
                            <View style={{ flex: 3 }}>
                              <Text style={styles.tableDescText}>{row.type}</Text>
                              <Text style={styles.tableSubDescText} numberOfLines={1}>{row.description}</Text>
                            </View>
                            <Text style={[
                              styles.tableBodyCol, 
                              { flex: 2, textAlign: 'right', fontWeight: '800' },
                              isCredit ? { color: '#10B981' } : { color: '#475569' }
                            ]}>
                              {isCredit ? '+' : '-'}{row.amount.toLocaleString('tr-TR')} ₺
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.statementFooter}>
                  <TouchableOpacity 
                    style={styles.closeStatementBtn} 
                    onPress={() => setStatementModalVisible(false)}
                  >
                    <Text style={styles.closeStatementBtnText}>Kapat</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  scrollView: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    maxWidth: 1100,
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  accountCard: {
    width: '100%',
    maxWidth: 1100,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 15,
    marginBottom: 12,
  },
  wholesalerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  wholesalerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  taxNo: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  detailLinkText: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '700',
    marginRight: 4,
  },
  contactDetails: {
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 13,
    color: '#64748B',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  limitColor: {
    color: '#1F2937',
  },
  debtColor: {
    color: '#EF4444',
  },
  remainingColor: {
    color: '#10B981',
  },
  progressSection: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  progressVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  highDebtText: {
    color: '#EF4444',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1E3A8A',
    borderRadius: 4,
  },
  highDebtFill: {
    backgroundColor: '#EF4444',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentButton: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  ledgerButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
    flexDirection: 'row',
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#FFFFFF',
  },
  ledgerButtonText: {
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
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
  statementModalContent: {
    maxHeight: '85%',
    width: '95%',
    maxWidth: 1100,
  },
  statementLoadingBox: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statementLoadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
    fontWeight: '600',
  },
  emptyStatementBox: {
    paddingVertical: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStatementText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  statementTableContainer: {
    flex: 1,
    marginTop: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderCol: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableBodyCol: {
    fontSize: 12,
    color: '#1E293B',
  },
  tableDescText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  tableSubDescText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  statementFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 15,
    marginTop: 10,
  },
  closeStatementBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeStatementBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 15,
    marginBottom: 15,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  modalCloseIcon: {
    padding: 4,
  },
  modalForm: {
    width: '100%',
  },
  bankInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  bankInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  bankDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 6,
  },
  bankDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  ibanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  bankDetailValueIBAN: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bankWarningText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 10,
    lineHeight: 14,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  filePickerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F97316',
  },
  fileSelectedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  fileSelectedText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 15,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 6,
    backgroundColor: '#FFFFFF',
  },
  modalCancelButtonText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 6,
    justifyContent: 'center',
  },
  modalSubmitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default CariAccountScreen;
