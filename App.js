import React, { useState, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { CartProvider } from './context/CartContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import TabNavigator from './navigation/TabNavigator';
import CartScreen from './screens/CartScreen';
import LoginModalComponent from './components/LoginModalComponent';
import RegisterModalComponent from './components/RegisterModalComponent';
import CategoryDetailScreen from './screens/Category/CategoryDetailScreen';
import OrderHistoryScreen from './screens/OrderHistoryScreen';
import CariAccountScreen from './screens/Profile/CariAccountScreen';
import WholesalerDetailScreen from './screens/WholesalerDetailScreen';
import PaymentApprovalsScreen from './screens/PremiumScreens/PaymentApprovalsScreen';

const Stack = createStackNavigator();

const App = () => {
  const [isLoginModalVisible, setLoginModalVisible] = useState(false);
  const [isRegisterModalVisible, setRegisterModalVisible] = useState(false);

  const showLoginModal = () => {
    setRegisterModalVisible(false); // Kayıt modalını kapat
    setLoginModalVisible(true);
  };

  const hideLoginModal = () => setLoginModalVisible(false);

  const showRegisterModal = () => {
    setLoginModalVisible(false); // Giriş modalını kapat
    setRegisterModalVisible(true);
  };

  const hideRegisterModal = () => setRegisterModalVisible(false);

  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#1E3A8A' },
              headerTintColor: '#FFFFFF',
            }}
          >
            <Stack.Screen
              name="Home"
              options={{ headerShown: false }}
            >
              {props => (
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
              options={{ headerTitle: 'Sepetim' }}
            />
            <Stack.Screen
              name="CategoryDetail"
              component={CategoryDetailScreen}
              options={({ route }) => ({
                headerTitle: route.params?.category?.name || 'Kategori Detayı',
              })}
            />
            <Stack.Screen
              name="OrderHistory"
              component={OrderHistoryScreen}
              options={{ headerTitle: 'Sipariş Geçmişi' }}
            />
            <Stack.Screen
              name="CariAccount"
              component={CariAccountScreen}
              options={{ headerTitle: 'Cari Hesaplarım' }}
            />
            <Stack.Screen
              name="WholesalerDetail"
              component={WholesalerDetailScreen}
              options={({ route }) => ({
                headerTitle: route.params?.wholesalerName || 'Tedarikçi Mağazası',
              })}
            />
            <Stack.Screen
              name="PaymentApprovals"
              component={PaymentApprovalsScreen}
              options={{ headerTitle: 'Ödeme Onayları' }}
            />
          </Stack.Navigator>

          <LoginModalComponent
            isVisible={isLoginModalVisible}
            onClose={hideLoginModal}
            onNavigateToRegister={showRegisterModal} // Kayıt modalına yönlendir
          />

          <RegisterModalComponent
            isVisible={isRegisterModalVisible}
            onClose={hideRegisterModal}
            onNavigateToLogin={showLoginModal} // Giriş modalına yönlendir
          />
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
