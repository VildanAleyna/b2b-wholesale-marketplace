import React, { useState } from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import TabNavigator from './navigation/TabNavigator';
import CartScreen from './screens/CartScreen';
import LoginModalComponent from './components/LoginModalComponent';
import RegisterModalComponent from './components/RegisterModalComponent';
import CategoryDetailScreen from './screens/Category/CategoryDetailScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import CariAccountScreen from './screens/Profile/CariAccountScreen';
import WholesalerDetailScreen from './screens/WholesalerDetailScreen';
import PaymentApprovalsScreen from './screens/PremiumScreens/PaymentApprovalsScreen';
import WholesalerOrdersScreen from './screens/PremiumScreens/WholesalerOrdersScreen';
import EditProfileScreen from './screens/Profile/EditProfileScreen';
import SettingsScreen from './screens/Profile/SettingsScreen';

const Stack = createStackNavigator();
const HEADER_BLUE = '#1E3A8A';

const BackButton = ({ navigation, screen }) => (
  <TouchableOpacity
    onPress={() => navigation.navigate('Home', { screen })}
    style={{ marginLeft: 16 }}
  >
    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
  </TouchableOpacity>
);

const createBackOptions = (navigation, headerTitle, screen = 'Profile') => ({
  headerTitle,
  headerLeft: () => <BackButton navigation={navigation} screen={screen} />,
});

const linking = {
  prefixes: [
    Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081') : 'toptanci://',
    'http://localhost:8081',
    'http://localhost:19006',
  ],
  config: {
    screens: {
      Home: {
        path: '',
        screens: {
          HomeScreen: 'products',
          Categories: 'categories',
          Favorites: 'favorites',
          Employees: 'employees',
          Profile: 'profile',
        },
      },
      Cart: 'cart',
      CategoryDetail: 'category',
      OrderHistory: 'orders',
      CariAccount: 'cari',
      WholesalerDetail: 'wholesaler',
      PaymentApprovals: 'payment-approvals',
      WholesalerOrders: 'wholesaler-orders',
      EditProfile: 'edit-profile',
      Settings: 'settings',
    },
  },
};

const App = () => {
  const [isLoginModalVisible, setLoginModalVisible] = useState(false);
  const [isRegisterModalVisible, setRegisterModalVisible] = useState(false);

  const showLoginModal = () => {
    setRegisterModalVisible(false);
    setLoginModalVisible(true);
  };

  const showRegisterModal = () => {
    setLoginModalVisible(false);
    setRegisterModalVisible(true);
  };

  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer linking={linking}>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: HEADER_BLUE },
              headerTintColor: '#FFFFFF',
            }}
          >
            <Stack.Screen name="Home" options={{ headerShown: false }}>
              {(props) => (
                <TabNavigator
                  {...props}
                  showLoginModal={showLoginModal}
                  showRegisterModal={showRegisterModal}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={({ navigation }) => createBackOptions(navigation, 'Sepetim', 'HomeScreen')}
            />
            <Stack.Screen
              name="CategoryDetail"
              component={CategoryDetailScreen}
              options={({ route, navigation }) => createBackOptions(
                navigation,
                route.params?.category?.name || 'Kategori Detayı',
                'Categories',
              )}
            />
            <Stack.Screen
              name="OrderHistory"
              component={OrderHistoryScreen}
              options={({ navigation }) => createBackOptions(navigation, 'Sipariş Geçmişi')}
            />
            <Stack.Screen
              name="CariAccount"
              component={CariAccountScreen}
              options={({ navigation }) => createBackOptions(navigation, 'Cari Hesaplarım')}
            />
            <Stack.Screen
              name="WholesalerDetail"
              component={WholesalerDetailScreen}
              options={({ route, navigation }) => createBackOptions(
                navigation,
                route.params?.wholesalerName || 'Tedarikçi Mağazası',
                'HomeScreen',
              )}
            />
            <Stack.Screen
              name="PaymentApprovals"
              component={PaymentApprovalsScreen}
              options={({ navigation }) => createBackOptions(navigation, 'Ödeme Onayları')}
            />
            <Stack.Screen
              name="WholesalerOrders"
              component={WholesalerOrdersScreen}
              options={({ navigation }) => createBackOptions(navigation, 'Gelen Siparişler')}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={({ navigation }) => createBackOptions(navigation, 'Profili Düzenle')}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={({ navigation }) => createBackOptions(navigation, 'Ayarlar')}
            />
          </Stack.Navigator>

          <LoginModalComponent
            isVisible={isLoginModalVisible}
            onClose={() => setLoginModalVisible(false)}
            onNavigateToRegister={showRegisterModal}
          />

          <RegisterModalComponent
            isVisible={isRegisterModalVisible}
            onClose={() => setRegisterModalVisible(false)}
            onNavigateToLogin={showLoginModal}
          />
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
