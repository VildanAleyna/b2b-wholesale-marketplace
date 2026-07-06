import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext'; // AuthContext'i içe aktar

const PremiumProfileScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext); // AuthContext'ten user ve logout al

  const handleLogout = () => {
    logout(); // Çıkış yapma işlemini gerçekleştir
    navigation.navigate('Home'); // Çıkış yaptıktan sonra giriş ekranına yönlendir
  };

  // Toptancı adı harf logosu (Örn: Vildan Toptan -> VT)
  const getInitials = (name) => {
    if (!name) return 'TO';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const showToast = (msg) => {
    // Profil ekranındaki gibi basit uyarılar için
    alert(msg);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileCard}>
        {/* Logo/Avatar */}
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
        </View>

        {/* Bilgiler */}
        <Text style={styles.name}>{user?.name || 'Tedarikçi Firma'}</Text>
        <Text style={styles.email}>{user?.email || 'firma@toptan.com'}</Text>

        {/* Hesap Türü Rozeti */}
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Toptancı / Tedarikçi</Text>
        </View>

        {/* Menü Listesi */}
        <View style={styles.menuList}>
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('PaymentApprovals')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#1E3A8A" style={styles.menuIcon} />
              <Text style={styles.menuText}>Ödeme Onayları</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('WholesalerOrders')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="cart-outline" size={20} color="#1E3A8A" style={styles.menuIcon} />
              <Text style={styles.menuText}>Gelen Siparişler</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="person-outline" size={20} color="#1E3A8A" style={styles.menuIcon} />
              <Text style={styles.menuText}>Firma Profilini Düzenle</Text>
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

          {/* Çıkış Yap */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  profileCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E3A8A', // Deep Navy
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 24,
  },
  roleBadgeText: {
    color: '#1E3A8A',
    fontSize: 11,
    fontWeight: '700',
  },
  menuList: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  logoutText: {
    color: '#EF4444',
  },
});

export default PremiumProfileScreen;
