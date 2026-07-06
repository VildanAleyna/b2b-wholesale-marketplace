import React, { useContext, useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { fetchUserCariAccounts, submitPurchase } from '../data/Data';

const CartScreen = ({ navigation }) => {
  const { cart, removeFromCart, increaseCount, decreaseCount, addToOrderHistory } = useContext(CartContext);
  const { user, setUser } = useContext(AuthContext);

  const [paymentMethod, setPaymentMethod] = useState('CreditCard'); // 'CreditCard' veya 'Cari'
  const [cariAccounts, setCariAccounts] = useState([]);
  const [selectedCariAccount, setSelectedCariAccount] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  // Cari hesap limitlerini yükle
  const loadCariAccounts = async () => {
    if (user && !user.wholesaler) {
      try {
        const accountsData = await fetchUserCariAccounts(user._id);
        setCariAccounts(accountsData);
        if (accountsData.length > 0) {
          setSelectedCariAccount(accountsData[0]); // Varsayılan olarak ilk cari hesabı seç
        }
      } catch (error) {
        console.error('Cari limitler yüklenirken hata:', error);
      }
    }
  };

  useEffect(() => {
    loadCariAccounts();
  }, [user]);

  // Ürünün toptancı fiyatını bul (en düşük)
  const getProductPrice = (item) => {
    if (!item.wholesalers || item.wholesalers.length === 0) return item.price || 0;
    return Math.min(...item.wholesalers.map(w => w.price));
  };

  // Kullanıcı seviyesine göre indirim çarpanı
  const getDiscountMultiplier = () => {
    if (!user) return 1.0;
    if (user.tier === 'Gold') return 0.8; // %20 İndirim
    if (user.tier === 'Silver') return 0.9; // %10 İndirim
    return 1.0; // %0 İndirim (Bronze veya Toptancı)
  };

  const discountMultiplier = getDiscountMultiplier();

  // İndirimli birim fiyatını hesapla
  const getDiscountedUnitPrice = (item) => {
    return Math.round(getProductPrice(item) * discountMultiplier);
  };

  // Sepet Finansal Hesaplamaları
  const totalBasePrice = cart.reduce((total, item) => total + (getProductPrice(item) * item.count), 0);
  const totalAmount = cart.reduce((total, item) => total + (getDiscountedUnitPrice(item) * item.count), 0);
  const totalDiscount = totalBasePrice - totalAmount;

  // Kargo Hesaplama (Gold ve Silver için ücretsiz. Bronze için 5000 ₺ üzeri ücretsiz, aksi takdirde 250 ₺)
  const isShippingFree = (user?.tier === 'Gold' || user?.tier === 'Silver' || totalAmount >= 5000);
  const shippingCost = isShippingFree ? 0 : 250;
  const grandTotal = totalAmount + shippingCost;

  // MOQ Limit Kontrolleri
  const isMoqViolated = cart.some(item => item.count < (item.minOrderQuantity || 1));

  // Cari Limit Yeterlilik Kontrolü
  const getRemainingCariLimit = () => {
    if (!selectedCariAccount) return 0;
    return selectedCariAccount.creditLimit - selectedCariAccount.currentDebt;
  };

  const remainingCariLimit = getRemainingCariLimit();
  const isCariLimitInsufficient = paymentMethod === 'Cari' && grandTotal > remainingCariLimit;

  // Otomatik Sadakat / İlerleme Durumu Hesaplama
  const getLoyaltyProgress = () => {
    if (!user) return null;
    const completedOrders = user.orders || [];
    const totalSpent = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    let currentTier = user.tier || 'Bronze';
    let nextTier = 'Silver';
    let target = 20000;
    let remaining = 20000 - totalSpent;

    if (currentTier === 'Silver') {
      nextTier = 'Gold';
      target = 100000;
      remaining = 100000 - totalSpent;
    } else if (currentTier === 'Gold') {
      nextTier = null;
      target = 100000;
      remaining = 0;
    }

    let percentage = 0;
    if (currentTier === 'Bronze') {
      percentage = Math.min(100, Math.max(0, (totalSpent / 20000) * 100));
    } else if (currentTier === 'Silver') {
      percentage = Math.min(100, Math.max(0, ((totalSpent - 20000) / 80000) * 100));
    } else {
      percentage = 100;
    }

    return {
      totalSpent,
      currentTier,
      nextTier,
      target,
      remaining,
      percentage
    };
  };

  const loyalty = getLoyaltyProgress();

  // Siparişi Tamamlama (Checkout)
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    if (!user) {
      showToast('Siparişi tamamlamak için lütfen giriş yapın.');
      return;
    }

    if (isMoqViolated) {
      showToast('Lütfen sepetinizdeki minimum sipariş adetlerini (MOQ) karşılayın.');
      return;
    }

    if (paymentMethod === 'Cari' && isCariLimitInsufficient) {
      showToast('Cari limitiniz bu siparişi tamamlamak için yetersizdir.');
      return;
    }

    setIsSubmitting(true);
    try {
      const wholesalerId = selectedCariAccount?.wholesalerId?._id || (cart[0]?.wholesalers?.[0]?.usersID);

      const purchaseDetails = {
        wholesalerId,
        totalAmount: grandTotal, // Kargo eklenmiş toplam tutarı iletiyoruz
        paymentMethod,
        products: cart.map(item => ({
          _id: item._id,
          title: item.title,
          image: item.image,
          price: getDiscountedUnitPrice(item),
          count: item.count
        }))
      };

      const response = await submitPurchase(user._id, purchaseDetails);

      if (response) {
        // Kullanıcı nesnesini ve yerel oturumu güncelle
        if (response.user) {
          setUser(response.user);
          await AsyncStorage.setItem('user', JSON.stringify(response.user));
        }

        // Sepeti temizle
        cart.forEach(item => removeFromCart(item._id));
        showToast('Siparişiniz başarıyla oluşturuldu! 🚀');
        
        // Sipariş geçmişine git
        setTimeout(() => {
          navigation.navigate('OrderHistory');
        }, 1500);
      }
    } catch (error) {
      console.error(error);
      const backendMessage = error.response?.data?.message || 'Sipariş tamamlanırken bir hata oluştu.';
      showToast(backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCartItem = ({ item }) => {
    const basePrice = getProductPrice(item);
    const discountedPrice = getDiscountedUnitPrice(item);
    const itemTotal = discountedPrice * item.count;
    const moq = item.minOrderQuantity || 1;
    const isUnderMoq = item.count < moq;

    return (
      <View style={styles.itemCard}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
          
          {/* Fiyat Satırı */}
          <View style={styles.priceRow}>
            {totalDiscount > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.oldPrice}>{basePrice.toLocaleString('tr-TR')} ₺</Text>
                <Text style={styles.newPrice}>{discountedPrice.toLocaleString('tr-TR')} ₺</Text>
              </View>
            ) : (
              <Text style={styles.price}>{basePrice.toLocaleString('tr-TR')} ₺</Text>
            )}
            <Text style={styles.itemTotal}>Toplam: {itemTotal.toLocaleString('tr-TR')} ₺</Text>
          </View>

          {/* MOQ Uyarısı */}
          {moq > 1 && (
            <View style={styles.moqInfoBox}>
              <Text style={styles.moqText}>Minimum Sipariş (MOQ): {moq} adet</Text>
              {isUnderMoq && (
                <View style={styles.moqWarningBadge}>
                  <Ionicons name="warning" size={12} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.moqWarningText}>En az {moq} adet sipariş edilmeli!</Text>
                </View>
              )}
            </View>
          )}

          {/* Sayaç ve Silme Butonları */}
          <View style={styles.counterRow}>
            <View style={styles.counter}>
              <TouchableOpacity onPress={() => decreaseCount(item._id)} style={styles.counterBtn}>
                <Ionicons name="remove" size={16} color="#475569" />
              </TouchableOpacity>
              <Text style={styles.counterVal}>{item.count}</Text>
              <TouchableOpacity onPress={() => increaseCount(item._id)} style={styles.counterBtn}>
                <Ionicons name="add" size={16} color="#475569" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item._id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={styles.deleteBtnText}>Sil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {toast.visible && (
        <View style={styles.toast}>
          <Ionicons name="information-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-handle-outline" size={80} color="#CBD5E1" style={{ marginBottom: 15 }} />
          <Text style={styles.emptyTitle}>Sepetiniz Boş</Text>
          <Text style={styles.emptySubtitle}>
            Toptan fırsatları kaçırmamak için hemen alışverişe başlayın ve sepetinize ürün ekleyin.
          </Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Home', { screen: 'HomeScreen' })}>
            <Text style={styles.shopBtnText}>Alışverişe Başla</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContainer}
            ListFooterComponent={
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Sipariş Özeti</Text>
                
                {/* Otomatik Sadakat / İlerleme Durumu */}
                {loyalty && (
                  <View style={[
                    styles.loyaltyBox,
                    loyalty.currentTier === 'Silver' && styles.loyaltyBoxSilver,
                    loyalty.currentTier === 'Gold' && styles.loyaltyBoxGold
                  ]}>
                    <View style={styles.loyaltyHeader}>
                      <Text style={styles.loyaltyTitle}>Bayi Derecesi:</Text>
                      <Text style={[
                        styles.loyaltyValue,
                        loyalty.currentTier === 'Silver' && styles.loyaltyValueSilver,
                        loyalty.currentTier === 'Gold' && styles.loyaltyValueGold
                      ]}>
                        {loyalty.currentTier} Bayi
                      </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={[
                        styles.progressBar, 
                        { width: `${loyalty.percentage}%` },
                        loyalty.currentTier === 'Silver' && styles.progressBarSilver,
                        loyalty.currentTier === 'Gold' && styles.progressBarGold
                      ]} />
                    </View>
                    <Text style={styles.loyaltyDesc}>
                      {loyalty.currentTier === 'Gold' ? (
                        '🏆 En yüksek VIP bayi iskontosu aktif! Tüm toptan alımlarda %20 indirimli fiyatları kullanıyorsunuz.'
                      ) : loyalty.currentTier === 'Silver' ? (
                        `Gold Bayi (%20 İndirim) olmak için son ${loyalty.remaining.toLocaleString('tr-TR')} ₺ harcama! (Toplam harcama: ${loyalty.totalSpent.toLocaleString('tr-TR')} ₺)`
                      ) : (
                        `Silver Bayi (%10 İndirim) olmak için son ${loyalty.remaining.toLocaleString('tr-TR')} ₺ harcama! (Toplam harcama: ${loyalty.totalSpent.toLocaleString('tr-TR')} ₺)`
                      )}
                    </Text>

                    <TouchableOpacity 
                      style={styles.perksBtn}
                      onPress={() => Alert.alert(
                        "Bayi Seviye Ayrıcalıkları",
                        "🥉 Bronze Bayi: Standart bayidir. 5.000 ₺ altındaki alımlarda 250 ₺ kargo ücreti yansıtılır.\n\n🥈 Silver Bayi: Toplam 20.000 ₺ sipariş verildiğinde otomatik aktifleşir. Tüm ürünlerde %10 indirim sağlar. Kargo tamamen ücretsizdir!\n\n🥇 Gold VIP Bayi: Toplam 100.000 ₺ sipariş verildiğinde otomatik aktifleşir. Tüm ürünlerde %20 dev indirim sağlar. Kargo tamamen ücretsizdir!",
                        [{ text: "Anladım", style: "default" }]
                      )}
                    >
                      <Ionicons name="information-circle-outline" size={14} color="#1E3A8A" style={{ marginRight: 4 }} />
                      <Text style={styles.perksBtnText}>Seviye Ayrıcalıklarını Gör</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Finansal Kalemler */}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Ara Toplam</Text>
                  <Text style={styles.summaryVal}>{totalBasePrice.toLocaleString('tr-TR')} ₺</Text>
                </View>
                {totalDiscount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.discountLabel}>Kazanılan Bayi İndirimi</Text>
                    <Text style={styles.discountVal}>- {totalDiscount.toLocaleString('tr-TR')} ₺</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Kargo Ücreti</Text>
                  <Text style={[styles.summaryVal, shippingCost === 0 && { color: '#10B981', fontWeight: '800' }]}>
                    {shippingCost === 0 ? 'Ücretsiz' : `${shippingCost} ₺`}
                  </Text>
                </View>
                {shippingCost > 0 && (
                  <Text style={styles.cargoAlert}>
                    * Gold/Silver bayilere veya 5.000 ₺ üzeri sepetlere kargo bedava!
                  </Text>
                )}
                
                <View style={[styles.summaryRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Ödenecek Toplam</Text>
                  <Text style={styles.grandTotalVal}>{grandTotal.toLocaleString('tr-TR')} ₺</Text>
                </View>

                {/* Ödeme Yöntemi Seçimi */}
                {user && !user.wholesaler && (
                  <View style={styles.paymentSelectionBox}>
                    <Text style={styles.paymentSecTitle}>Ödeme Yöntemi Seçin</Text>
                    
                    <View style={styles.paymentOptions}>
                      <TouchableOpacity 
                        style={[styles.payOption, paymentMethod === 'CreditCard' && styles.payOptionActive]}
                        onPress={() => setPaymentMethod('CreditCard')}
                      >
                        <Ionicons name="card" size={18} color={paymentMethod === 'CreditCard' ? '#1E3A8A' : '#64748B'} style={{ marginRight: 6 }} />
                        <Text style={[styles.payOptionText, paymentMethod === 'CreditCard' && styles.payOptionTextActive]}>
                          Kredi Kartı
                        </Text>
                      </TouchableOpacity>

                      {cariAccounts.length > 0 && (
                        <TouchableOpacity 
                          style={[styles.payOption, paymentMethod === 'Cari' && styles.payOptionActive]}
                          onPress={() => setPaymentMethod('Cari')}
                        >
                          <Ionicons name="wallet" size={18} color={paymentMethod === 'Cari' ? '#1E3A8A' : '#64748B'} style={{ marginRight: 6 }} />
                          <Text style={[styles.payOptionText, paymentMethod === 'Cari' && styles.payOptionTextActive]}>
                            Cari Hesaptan Düş
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Cari Hesap Detayı */}
                    {paymentMethod === 'Cari' && selectedCariAccount && (
                      <View style={styles.cariDetailsBox}>
                        <Text style={styles.cariWholesalerName}>{selectedCariAccount.wholesalerId?.name}</Text>
                        <View style={styles.cariStatsRow}>
                          <Text style={styles.cariLimitLabel}>Kalan Cari Limit:</Text>
                          <Text style={[styles.cariLimitVal, isCariLimitInsufficient && styles.insufficientLimitText]}>
                            {remainingCariLimit.toLocaleString('tr-TR')} ₺
                          </Text>
                        </View>
                        {isCariLimitInsufficient && (
                          <Text style={styles.warningMessage}>
                            * Cari hesabınızdaki kalan bakiye limitiniz bu sipariş için yetersizdir.
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* Ödeme / Tamamlama Butonu */}
                <TouchableOpacity 
                  style={[
                    styles.checkoutBtn, 
                    (isMoqViolated || isCariLimitInsufficient) && styles.checkoutBtnDisabled
                  ]}
                  onPress={handleCheckout}
                  disabled={isSubmitting || isMoqViolated || isCariLimitInsufficient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.checkoutBtnText}>
                        {isMoqViolated 
                          ? 'Minimum Sipariş Sınırını Aşın' 
                          : isCariLimitInsufficient 
                            ? 'Yetersiz Cari Limit' 
                            : 'Siparişi Tamamla'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100, // Tab bar taşmasını önle
    alignItems: 'center',
  },
  itemCard: {
    width: Platform.OS === 'web' ? 650 : '100%',
    maxWidth: 650,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productImage: {
    width: Platform.OS === 'web' ? 85 : 65,
    height: Platform.OS === 'web' ? 85 : 65,
    borderRadius: 10,
    marginRight: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  oldPrice: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'underlineLine',
    marginRight: 6,
  },
  newPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981', // Yeşil indirimli fiyat
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  moqInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  moqText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  moqWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  moqWarningText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '700',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
  },
  counterBtn: {
    padding: 6,
  },
  counterVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    paddingHorizontal: 12,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  deleteBtnText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 140,
    paddingHorizontal: 40,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  shopBtn: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  shopBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  summaryContainer: {
    width: Platform.OS === 'web' ? 650 : '100%',
    maxWidth: 650,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 15,
  },
  tierInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tierInfoText: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
  },
  discountLabel: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  discountVal: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  paymentSelectionBox: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 15,
    marginBottom: 20,
  },
  paymentSecTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  payOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
  },
  payOptionActive: {
    borderColor: '#1E3A8A',
    backgroundColor: '#EFF6FF',
  },
  payOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  payOptionTextActive: {
    color: '#1E3A8A',
  },
  cariDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cariWholesalerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  cariStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cariLimitLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  cariLimitVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
  },
  insufficientLimitText: {
    color: '#EF4444',
  },
  warningMessage: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 8,
  },
  checkoutBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  checkoutBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
  loyaltyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  loyaltyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  loyaltyValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1E3A8A',
    borderRadius: 4,
  },
  loyaltyDesc: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 14,
    marginBottom: 8,
  },
  perksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  perksBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E3A8A',
    textDecorationLine: 'underline',
  },
  cargoAlert: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    marginTop: -6,
    marginBottom: 10,
    paddingLeft: 2,
  },
});

export default CartScreen;
