import React, { useContext, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getModalWidth, isWeb } from '../constants/responsiveLayout';

const LoginModalComponent = ({ isVisible, onClose, onNavigateToRegister }) => {
  const { login } = useContext(AuthContext);
  const { width: windowWidth } = useWindowDimensions();
  const modalWidth = getModalWidth(windowWidth, 460);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const closeModal = () => {
    setErrorMessage('');
    onClose();
  };

  const handleLogin = async () => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setErrorMessage('Lütfen kullanıcı adı/e-posta ve şifre girin.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await login(trimmedUsername, password);

      if (result.success) {
        setUsername('');
        setPassword('');
        closeModal();
      } else {
        setErrorMessage(result.message || 'Giriş bilgileri hatalı. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      setErrorMessage('Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToRegister = () => {
    setErrorMessage('');
    onNavigateToRegister();
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={isVisible}
      onRequestClose={closeModal}
    >
      <TouchableWithoutFeedback onPress={closeModal}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.modalContent, isWeb && { width: modalWidth }]}>
              <Text style={styles.modalTitle}>Giriş Yap</Text>

              <TextInput
                placeholder="E-posta veya personel kullanıcı adı"
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  setErrorMessage('');
                }}
                style={styles.input}
                autoCapitalize="none"
              />

              <TextInput
                placeholder="Şifre"
                secureTextEntry
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setErrorMessage('');
                }}
                style={styles.input}
              />

              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleLogin}
                style={[styles.modalButton, isLoading && styles.modalButtonDisabled]}
                disabled={isLoading}
              >
                <Text style={styles.modalButtonText}>
                  {isLoading ? 'Kontrol ediliyor...' : 'Giriş Yap'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleNavigateToRegister} style={styles.modalLinkButton}>
                <Text style={styles.modalLinkButtonText}>Hesabınız yok mu? Kayıt Olun</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333333',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.7,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalLinkButton: {
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  modalLinkButtonText: {
    color: '#007BFF',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  modalCloseButton: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginModalComponent;
