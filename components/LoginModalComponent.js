import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, TouchableWithoutFeedback, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';

const LoginModalComponent = ({ isVisible, onClose, onNavigateToRegister }) => {
  const { login } = useContext(AuthContext); // AuthContext'ten login fonksiyonunu alıyoruz
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      Alert.alert('Giriş Yapılıyor', 'Lütfen bekleyin...'); // Loader göstermek yerine geçici bir alert
      const result = await login(username, password);
      if (result.success) {
        Alert.alert('Giriş Başarılı', 'Hoş geldiniz!');
        onClose(); // Modalı kapat
      } else {
        Alert.alert('Giriş Başarısız', result.message);
      }
    } catch (error) {
      Alert.alert('Giriş Hatası', 'Bir hata oluştu, lütfen tekrar deneyin.');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Giriş Yap</Text>
              <TextInput 
                placeholder="E-posta veya personel kullanıcı adı" 
                value={username}
                onChangeText={setUsername}
                style={styles.input} 
              />
              <TextInput 
                placeholder="Şifre" 
                secureTextEntry={true} 
                value={password}
                onChangeText={setPassword}
                style={styles.input} 
              />
              <TouchableOpacity onPress={handleLogin} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Giriş Yap</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onNavigateToRegister} style={styles.modalLinkButton}>
                <Text style={styles.modalLinkButtonText}>Hesabınız yok mu? Kayıt Olun</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Modal arka plan rengini ayarlıyoruz
  },
  modalContent: {
    width: '90%', // Genişliği %90 olarak ayarladık
    maxWidth: 400, // Maksimum genişliği 400 piksel olarak belirledik
    backgroundColor: '#ffffff',
    borderRadius: 20, // Köşe yuvarlama oranını artırdık
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24, // Başlık font boyutunu artırdık
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333333',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: '#007bff', // Buton rengini daha belirgin mavi yaptık
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalLinkButton: {
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  modalLinkButtonText: {
    color: '#007bff', // Bağlantı rengini mavi yaptık
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  modalCloseButton: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#ff0000', // Kapat buton rengini kırmızı yaptık
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginModalComponent;
