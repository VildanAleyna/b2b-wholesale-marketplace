import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, TouchableWithoutFeedback, Alert } from 'react-native';
import axios from 'axios';
import { fetchUsers } from '../data/Data';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://192.168.1.108:3000';

const RegisterModalComponent = ({ isVisible, onClose, onNavigateToLogin }) => {
  const { loadUsers } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [wholesaler, setWholesaler] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadUsersData = async () => {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (error) {
        console.error("Kullanıcıları yükleme hatası:", error);
      }
    };

    loadUsersData();
  }, []);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    if (wholesaler === null) {
      Alert.alert('Hata', 'Lütfen bir kullanıcı türü seçin.');
      return;
    }

    try {
      const userData = {
        name,
        email,
        password,
        taxNumber,
        wholesaler,
        ...(wholesaler ? { employee: [] } : { favorites: [] })
      };

      await axios.post(`${API_URL}/register`, userData);
      Alert.alert('Başarı', 'Kayıt başarılı!');
      
      await loadUsers();

      onClose();
    } catch (error) {
      console.error('Kayıt sırasında bir hata oluştu:', error);
      Alert.alert('Hata', 'Kayıt sırasında bir hata oluştu.');
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
              <Text style={styles.modalTitle}>Kayıt</Text>
              <TextInput
                placeholder="Ad Soyad"
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                placeholder="Email"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                placeholder="Şifre"
                secureTextEntry={true}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                placeholder="Şifreyi Tekrar Girin"
                secureTextEntry={true}
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TextInput
                placeholder="Vergi Numarası"
                style={styles.input}
                value={taxNumber}
                onChangeText={setTaxNumber}
              />
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[styles.radioButton, wholesaler === true && styles.selectedRadio]}
                  onPress={() => setWholesaler(true)}
                >
                  <Text style={styles.radioButtonText}>Toptancı</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioButton, wholesaler === false && styles.selectedRadio]}
                  onPress={() => setWholesaler(false)}
                >
                  <Text style={styles.radioButtonText}>Esnaf</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleRegister} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Kayıt Ol</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onNavigateToLogin} style={styles.loginLink}>
                <Text style={styles.loginLinkText}>Hesabınız var mı? Giriş Yapın</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333333',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  radioButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    backgroundColor: '#007bff',
  },
  radioButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  modalButton: {
    marginTop: 12,
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 15,
  },
  loginLinkText: {
    fontSize: 16,
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});

export default RegisterModalComponent;
