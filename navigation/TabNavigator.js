// TabNavigator.js
import React, { useContext } from 'react';
import { View, StyleSheet, Button, TouchableOpacity, Text } from 'react-native';
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

const Tab = createBottomTabNavigator();

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
            case 'Çalışanlar':
              iconName = focused ? 'people' : 'people-outline';
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
      <Tab.Screen name="HomeScreen" component={HomeScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen 
        name={user ? (user.wholesaler ? 'Çalışanlar' : 'Favorites') : 'Favorites'}
        component={user ? (user.wholesaler ? EmployeesScreen : FavoritesScreen) : FavoritesScreen} 
      />
      <Tab.Screen
        name="Profile"
        component={user ? (user.wholesaler ? PremiumProfileScreen : ProfileScreen) : LoginReminderScreen}
      />
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
});

export default TabNavigator;


