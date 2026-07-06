// TabNavigator.js
import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { Badge } from '@rneui/themed';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import CategoriesScreen from '../screens/Category/CategoriesScreen';
import HomeScreen from '../screens/HomeScreen';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import LoginReminderScreen from '../screens/Profile/LoginReminderScreen';
import PremiumProfileScreen from '../screens/Profile/PremiumProfileScreen';
import EmployeesScreen from '../screens/PremiumScreens/EmployeesScreen';
import PaymentApprovalsScreen from '../screens/PremiumScreens/PaymentApprovalsScreen';
import WholesalerOrdersScreen from '../screens/PremiumScreens/WholesalerOrdersScreen';
import StockScreen from '../screens/PremiumScreens/StockScreen';
import AccountingScreen from '../screens/PremiumScreens/AccountingScreen';
import { EMPLOYEE_ROLES, USER_ACCOUNT_TYPES } from '../constants/roles';

const Tab = createBottomTabNavigator();

const EmployeeProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const rolePermissions = {
    [EMPLOYEE_ROLES.WAREHOUSE]: ['Gelen siparişleri görür', 'Sipariş durumunu günceller', 'Stok ve sevkiyat sürecini takip eder'],
    [EMPLOYEE_ROLES.ACCOUNTING]: ['Ödeme bildirimlerini görür', 'Cari süreçleri takip eder', 'Tahsilat operasyonlarını yönetir'],
    [EMPLOYEE_ROLES.SALES]: ['Siparişleri takip eder', 'Bayi ilişkilerini yürütür', 'Ürün ve müşteri operasyonlarını izler'],
  };
  const permissions = rolePermissions[user?.employeeRole] || ['Rolüne atanmış operasyonları görüntüler'];

  return (
    <View style={styles.employeeProfileContainer}>
      <View style={styles.employeeProfileShell}>
        <View style={styles.employeeProfileHeader}>
          <View style={styles.employeeAvatar}>
            <Ionicons name="person" size={30} color="#FFFFFF" />
          </View>
          <View style={styles.employeeHeaderInfo}>
            <Text style={styles.employeeEyebrow}>Personel Profili</Text>
            <Text style={styles.employeeName}>{user?.name}</Text>
            <Text style={styles.employeeCompany}>{user?.wholesalerName || user?.companyName || 'Toptancı Firma'}</Text>
          </View>
        </View>

        <View style={styles.employeeInfoGrid}>
          <View style={styles.employeeInfoBox}>
            <Text style={styles.employeeInfoLabel}>Hesap Tipi</Text>
            <Text style={styles.employeeInfoValue}>Sınırlı Personel</Text>
          </View>
          <View style={styles.employeeInfoBox}>
            <Text style={styles.employeeInfoLabel}>Rol</Text>
            <Text style={styles.employeeInfoValue}>{user?.employeeRole || 'Personel'}</Text>
          </View>
        </View>

        <View style={styles.employeeSection}>
          <Text style={styles.employeeSectionTitle}>Yetki Kapsamı</Text>
          {permissions.map((permission) => (
            <View key={permission} style={styles.permissionRow}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.permissionText}>{permission}</Text>
            </View>
          ))}
        </View>

        <View style={styles.employeeNotice}>
          <Ionicons name="information-circle-outline" size={18} color="#1E3A8A" style={{ marginRight: 8 }} />
          <Text style={styles.employeeNoticeText}>
            Bu hesap yalnızca göreviyle ilgili menülere erişebilir. Firma ayarları ve personel yönetimi admin hesabında kalır.
          </Text>
        </View>

        <View style={styles.employeeFooter}>
          <TouchableOpacity style={styles.employeeLogoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.employeeLogoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const TabNavigator = ({ navigation, showLoginModal, showRegisterModal }) => {
  const { cart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const cartItemCount = cart.length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let IconComponent = Ionicons;

          switch (route.name) {
            case 'Favorites':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            case 'Categories':
              IconComponent = AntDesign;
              iconName = focused ? 'appstore1' : 'appstore-o';
              break;
            case 'HomeScreen':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Employees':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'WholesalerOrdersTab':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case 'PaymentApprovalsTab':
              iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
              break;
            case 'AccountingTab':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'StockTab':
              iconName = focused ? 'cube' : 'cube-outline';
              break;
            case 'EmployeeProfile':
              iconName = focused ? 'id-card' : 'id-card-outline';
              break;
            default:
              iconName = 'home';
          }
          return (
            <View style={styles.iconContainer}>
              <IconComponent name={iconName} size={size} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          );
        },
        tabBarActiveTintColor: '#1E3A8A',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          borderRadius: 20, // Bottom tab bar köşe yuvarlama
          marginHorizontal: 10, // Sol ve sağda boşluk bırak
          position: 'absolute', // Position absolute yaparak sayfa içeriği üzerinde durmasını sağla
          left: 10,
          right: 10,
          bottom: 10,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 5,
        },
        tabBarBackground: () => (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 15 }} />
        ),
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#1E3A8A', // Deep Navy
          borderBottomColor: '#1E3A8A', 
          borderBottomWidth: 1,
          elevation: 4,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 5,
        },
        headerTintColor: '#FFFFFF', // Header metin rengi (Beyaz)
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            {!user && (
              <>
                <TouchableOpacity
                  style={styles.outlineHeaderButton}
                  onPress={showLoginModal}
                >
                  <Text style={styles.outlineHeaderButtonText}>Giriş Yap</Text>
                </TouchableOpacity>
                <View style={styles.spacer} />
                <TouchableOpacity
                  style={styles.outlineHeaderButton}
                  onPress={showRegisterModal}
                >
                  <Text style={styles.outlineHeaderButtonText}>Kayıt Ol</Text>
                </TouchableOpacity>
              </>
            )}
            <View style={styles.spacer} />
            {!user || !user.wholesaler ? (
              <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartIconContainer}>
                <Ionicons name="cart-outline" size={20} color="#FFFFFF" style={styles.cartIcon} />
                {cartItemCount > 0 && (
                  <Badge
                    value={cartItemCount}
                    status="warning"
                    containerStyle={styles.badgeContainer}
                  />
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        ),
      })}
    >
      {!user || !user.wholesaler ? (
        <>
          <Tab.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Ürünler', tabBarLabel: 'Ürünler' }} />
          <Tab.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Kategoriler', tabBarLabel: 'Kategoriler' }} />
          <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favoriler', tabBarLabel: 'Favoriler' }} />
          <Tab.Screen
            name="Profile"
            component={user ? ProfileScreen : LoginReminderScreen}
            options={{ title: 'Profil', tabBarLabel: 'Profil' }}
          />
        </>
      ) : user.accountType === USER_ACCOUNT_TYPES.EMPLOYEE || user.employeeAccount ? (
        <>
          {user.employeeRole === EMPLOYEE_ROLES.WAREHOUSE && (
            <>
              <Tab.Screen name="WholesalerOrdersTab" component={WholesalerOrdersScreen} options={{ title: 'Gelen Siparişler', tabBarLabel: 'Siparişler' }} />
              <Tab.Screen name="StockTab" component={StockScreen} options={{ title: 'Stok Yönetimi', tabBarLabel: 'Stok' }} />
            </>
          )}

          {user.employeeRole === EMPLOYEE_ROLES.ACCOUNTING && (
            <>
              <Tab.Screen name="AccountingTab" component={AccountingScreen} options={{ title: 'Cari Hesaplar', tabBarLabel: 'Cari' }} />
              <Tab.Screen name="PaymentApprovalsTab" component={PaymentApprovalsScreen} options={{ title: 'Ödeme Onayları', tabBarLabel: 'Ödemeler' }} />
            </>
          )}

          {user.employeeRole === EMPLOYEE_ROLES.SALES && (
            <>
              <Tab.Screen name="WholesalerOrdersTab" component={WholesalerOrdersScreen} options={{ title: 'Gelen Siparişler', tabBarLabel: 'Siparişler' }} />
              <Tab.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Ürünler', tabBarLabel: 'Ürünler' }} />
            </>
          )}

          <Tab.Screen name="EmployeeProfile" component={EmployeeProfileScreen} options={{ title: 'Profil', tabBarLabel: 'Profil' }} />
        </>
      ) : (
        <>
          <Tab.Screen name="WholesalerOrdersTab" component={WholesalerOrdersScreen} options={{ title: 'Gelen Siparişler', tabBarLabel: 'Siparişler' }} />
          <Tab.Screen name="AccountingTab" component={AccountingScreen} options={{ title: 'Cari Hesaplar', tabBarLabel: 'Cari' }} />
          <Tab.Screen name="PaymentApprovalsTab" component={PaymentApprovalsScreen} options={{ title: 'Ödeme Onayları', tabBarLabel: 'Ödemeler' }} />
          <Tab.Screen name="StockTab" component={StockScreen} options={{ title: 'Stok Yönetimi', tabBarLabel: 'Stok' }} />
          <Tab.Screen name="Employees" component={EmployeesScreen} options={{ title: 'Çalışanlar', tabBarLabel: 'Çalışanlar' }} />
          <Tab.Screen name="Profile" component={PremiumProfileScreen} options={{ title: 'Profil', tabBarLabel: 'Profil' }} />
        </>
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -5,
    width: 30,
    height: 3,
    backgroundColor: '#1E3A8A',
    borderRadius: 2,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  spacer: {
    width: 10,
  },
  cartIconContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    padding: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cartIcon: {
    marginRight: 0,
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  outlineHeaderButton: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  outlineHeaderButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  employeeProfileContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  employeeProfileShell: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  employeeProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 18,
    marginBottom: 16,
  },
  employeeAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  employeeHeaderInfo: {
    flex: 1,
  },
  employeeEyebrow: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  employeeName: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  employeeCompany: {
    color: '#64748B',
    fontSize: 13,
  },
  employeeInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  employeeInfoBox: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 13,
    marginHorizontal: 6,
    marginBottom: 10,
  },
  employeeInfoLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  employeeInfoValue: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '900',
  },
  employeeSection: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  employeeSectionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 10,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  employeeNotice: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 13,
    marginBottom: 16,
  },
  employeeNoticeText: {
    flex: 1,
    color: '#475569',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  employeeFooter: {
    alignItems: 'flex-end',
  },
  employeeLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  employeeLogoutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default TabNavigator;


