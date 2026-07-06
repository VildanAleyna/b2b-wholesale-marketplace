import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LoginModalComponent from '../../components/LoginModalComponent';
import RegisterModalComponent from '../../components/RegisterModalComponent';

const isWeb = Platform.OS === 'web';

const LoginReminderScreen = ({ navigation }) => {
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
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="person-circle-outline" size={72} color="#1E3A8A" style={styles.icon} />
        
        <Text style={styles.title}>Profilinize Erişin</Text>
        <Text style={styles.subtitle}>
          Sipariş geçmişinizi görüntülemek, favori listenizi yönetmek ve toptancı mağazanızı kontrol etmek için giriş yapmalısınız.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={showLoginModal}>
          <Text style={styles.primaryButtonText}>Giriş Yap</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>veya</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={showRegisterModal}>
          <Text style={styles.secondaryButtonText}>Yeni Hesap Oluştur</Text>
        </TouchableOpacity>
      </View>

      <LoginModalComponent
        isVisible={isLoginModalVisible}
        onClose={hideLoginModal}
        onNavigateToRegister={showRegisterModal}
      />

      <RegisterModalComponent
        isVisible={isRegisterModalVisible}
        onClose={hideRegisterModal}
        onNavigateToLogin={showLoginModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC', // Kırık beyaz arka fon
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 24,
    width: '100%',
    maxWidth: 420, // Web'de yayılmayı engeller
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A8A', // Derin Lacivert
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B', // Slate Gray
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#1E3A8A', // Solid Lacivert
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#1E3A8A', // Outlined Lacivert
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#1E3A8A',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default LoginReminderScreen;
