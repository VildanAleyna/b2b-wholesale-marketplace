import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';

const isWeb = Platform.OS === 'web';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext); // user ve logout'u AuthContext'ten alıyoruz
  const [toast, setToast] = useState({ visible: false, message: '' });

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast({ visible: false, message: '' });
    }, 2500);
  };

  const handleLogout = () => {
    logout();
    navigation.navigate('Home');
  };

  // Kullanıcı adının baş harflerini al
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <View style={styles.container}>
      {toast.visible && (
        <View style={styles.toast}>
          <Ionicons name="information-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          {/* Harf Logolu Premium Avatar */}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>

          {/* Dinamik Kullanıcı Bilgileri */}
          <Text style={styles.username}>{user?.name || 'Kullanıcı Adı'}</Text>
          <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>

          {/* Hesap Türü Rozeti */}
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Bayi / Müşteri</Text>
          </View>

          {/* Otomatik Sadakat / İlerleme Durumu */}
          {(() => {
            const completedOrders = user?.orders || [];
            const totalSpent = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
            
            let currentTier = user?.tier || 'Bronze';
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

            return (
              <View style={[
                styles.loyaltyBox,
                currentTier === 'Silver' && styles.loyaltyBoxSilver,
                currentTier === 'Gold' && styles.loyaltyBoxGold
              ]}>
                <View style={styles.loyaltyHeader}>
                  <Text style={styles.loyaltyTitle}>Bayi Derecesi:</Text>
                  <Text style={[
                    styles.loyaltyValue,
                    currentTier === 'Silver' && styles.loyaltyValueSilver,
                    currentTier === 'Gold' && styles.loyaltyValueGold
                  ]}>
                    {currentTier} Bayi
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[
                    styles.progressBar, 
                    { width: `${percentage}%` },
                    currentTier === 'Silver' && styles.progressBarSilver,
                    currentTier === 'Gold' && styles.progressBarGold
                  ]} />
                </View>
                <Text style={styles.loyaltyDesc}>
                  {currentTier === 'Gold' ? (
                    '🏆 En yüksek VIP bayi iskontosu aktif! Tüm toptan alımlarda %20 indirimli fiyatları kullanıyorsunuz.'
                  ) : currentTier === 'Silver' ? (
                    `Gold Bayi (%20 İndirim) olmak için son ${remaining.toLocaleString('tr-TR')} ₺ harcama! (Toplam: ${totalSpent.toLocaleString('tr-TR')} ₺)`
                  ) : (
                    `Silver Bayi (%10 İndirim) olmak için son ${remaining.toLocaleString('tr-TR')} ₺ harcama! (Toplam: ${totalSpent.toLocaleString('tr-TR')} ₺)`
                  )}
                </Text>
              </View>
            );
          })()}

          {/* Menü Listesi */}
          <View style={styles.menuList}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigation.navigate('EditProfile')}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="person-outline" size={20} color="#1E3A8A" style={styles.menuIcon} />
                <Text style={styles.menuText}>Profili Düzenle</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigation.navigate('OrderHistory')}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="receipt-outline" size={20} color="#1E3A8A" style={styles.menuIcon} />
                <Text style={styles.menuText}>Sipariş Geçmişi</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigation.navigate('CariAccount')}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="wallet-outline" size={20} color="#1E3A8A" style={styles.menuIcon} />
                <Text style={styles.menuText}>Cari Hesaplarım</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigation.navigate('Settings')}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="settings-outline" size={20} color="#1E3A8A" style={styles.menuIcon} />
                <Text style={styles.menuText}>Ayarlar</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Çıkış Yap Butonu */}
            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
              <View style={styles.menuLeft}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.menuIcon} />
                <Text style={[styles.menuText, styles.logoutText]}>Çıkış Yap</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color="#EF4444" style={{ opacity: 0.5 }} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Kırık beyaz arka fon
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 35,
    borderRadius: 24,
    width: '100%',
    maxWidth: 800, // Web'de aşırı sıkışmayı ve kesilmeleri önler
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EFF6FF', // Hafif mavi arka plan
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E3A8A', // Koyu lacivert harfler
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginBottom: 30,
  },
  roleBadgeText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  menuList: {
    width: '100%',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  logoutItem: {
    backgroundColor: '#FEF2F2', // Hafif kırmızımsı zemin
    borderColor: '#FEE2E2',
    marginTop: 10,
  },
  logoutText: {
    color: '#EF4444', // Kırmızı yazı
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
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loyaltyBoxSilver: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  loyaltyBoxGold: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
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
    fontWeight: '850',
    color: '#475569',
  },
  loyaltyValueSilver: {
    color: '#1E293B',
  },
  loyaltyValueGold: {
    color: '#D97706',
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
    backgroundColor: '#475569',
    borderRadius: 4,
  },
  progressBarSilver: {
    backgroundColor: '#3B82F6',
  },
  progressBarGold: {
    backgroundColor: '#D97706',
  },
  loyaltyDesc: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 14,
  },
});

export default ProfileScreen;
