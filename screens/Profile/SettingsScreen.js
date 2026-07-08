import React, { useState, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { updateUserSettings } from '../../data/Data';
import { FONT_FAMILY } from '../../constants/uiTheme';

const SettingsScreen = ({ navigation }) => {
  const { user, setUser } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [notificationEmail, setNotificationEmail] = useState(
    user?.notificationEmail !== undefined ? user.notificationEmail : true
  );
  const [notificationLimitWarning, setNotificationLimitWarning] = useState(
    user?.notificationLimitWarning !== undefined ? user.notificationLimitWarning : true
  );

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 2500);
  };

  const handleSaveSettings = async () => {
    if (newPassword || confirmPassword) {
      if (newPassword.length < 4) {
        showToast('Yeni şifre en az 4 karakter uzunluğunda olmalıdır.', 'error');
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast('Yeni şifreler uyuşmuyor.', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await updateUserSettings(user._id, {
        notificationEmail,
        notificationLimitWarning,
        newPassword: newPassword || undefined
      });

      if (response && response.user) {
        setUser(response.user);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        
        showToast('Ayarlarınız ve tercihleriniz başarıyla güncellendi!', 'success');
        setTimeout(() => {
          navigation.navigate('Home', { screen: 'Profile' });
        }, 1800);
      } else {
        showToast('Ayarlar güncellenirken hata oluştu.', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Bağlantı hatası oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Özel Konsept Premium Toast Bildirimi */}
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <Ionicons 
            name={toast.type === 'success' ? "checkmark-circle" : "alert-circle"} 
            size={18} 
            color="#FFFFFF" 
            style={{ marginRight: 8 }} 
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.card, isLargeScreen && styles.cardLarge]}>
          
          <View style={isLargeScreen ? styles.formRow : styles.formColumn}>
            {/* Sol Kolon: Bildirim Tercihleri */}
            <View style={isLargeScreen ? [styles.leftCol, { paddingRight: 40 }] : styles.fullWidth}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconCircle, isLargeScreen && styles.iconCircleLarge]}>
                  <Ionicons name="notifications" size={isLargeScreen ? 20 : 18} color="#1E3A8A" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={[styles.sectionTitle, isLargeScreen && styles.sectionTitleLarge]}>Bildirim Tercihleri</Text>
                  <Text style={[styles.sectionSubtitle, isLargeScreen && styles.sectionSubtitleLarge]}>
                    Hangi durumlarda e-posta veya anlık bildirim almak istediğinizi seçin.
                  </Text>
                </View>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, isLargeScreen && styles.settingLabelLarge]}>E-posta Bilgilendirmeleri</Text>
                  <Text style={[styles.settingDesc, isLargeScreen && styles.settingDescLarge]}>
                    Siparişiniz kargolandığında veya teslim alındığında e-posta alın.
                  </Text>
                </View>
                <Switch
                  value={notificationEmail}
                  onValueChange={setNotificationEmail}
                  trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                  thumbColor={notificationEmail ? '#1E3A8A' : '#94A3B8'}
                  style={isLargeScreen ? { transform: [{ scaleX: 1.15 }, { scaleY: 1.15 }] } : null}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, isLargeScreen && styles.settingLabelLarge]}>Cari Limit Aşım Uyarıları</Text>
                  <Text style={[styles.settingDesc, isLargeScreen && styles.settingDescLarge]}>
                    Cari borcunuz limitinizin %80'ine ulaştığında limit uyarısı alın.
                  </Text>
                </View>
                <Switch
                  value={notificationLimitWarning}
                  onValueChange={setNotificationLimitWarning}
                  trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                  thumbColor={notificationLimitWarning ? '#1E3A8A' : '#94A3B8'}
                  style={isLargeScreen ? { transform: [{ scaleX: 1.15 }, { scaleY: 1.15 }] } : null}
                />
              </View>
            </View>

            {/* Sağ Kolon: Şifre Değiştir */}
            <View style={isLargeScreen ? [styles.rightCol, { paddingLeft: 40, borderLeftWidth: 1, borderLeftColor: '#E2E8F0' }] : styles.fullWidth}>
              <View style={[styles.sectionHeader, !isLargeScreen && { marginTop: 24 }]}>
                <View style={[styles.iconCircle, isLargeScreen && styles.iconCircleLarge]}>
                  <Ionicons name="lock-closed" size={isLargeScreen ? 20 : 18} color="#1E3A8A" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={[styles.sectionTitle, isLargeScreen && styles.sectionTitleLarge]}>Şifre Değiştir</Text>
                  <Text style={[styles.sectionSubtitle, isLargeScreen && styles.sectionSubtitleLarge]}>
                    Hesap güvenliğinizi korumak için şifrenizi güncelleyin.
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, isLargeScreen && styles.labelLarge]}>Yeni Şifre</Text>
                <TextInput
                  style={[styles.input, isLargeScreen && styles.inputLarge]}
                  placeholder="Yeni şifrenizi girin..."
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={true}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, isLargeScreen && styles.labelLarge]}>Yeni Şifre Tekrar</Text>
                <TextInput
                  style={[styles.input, isLargeScreen && styles.inputLarge]}
                  placeholder="Yeni şifrenizi tekrar girin..."
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={true}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>
          </View>

          {/* Çift Buton Grubu: İptal ve Kaydet */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.navigate('Home', { screen: 'Profile' })}
            >
              <Ionicons name="arrow-back-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.backBtnText}>Geri Dön</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveSettings}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Ayarları Kaydet</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  toast: {
    position: 'absolute',
    top: 24,
    left: '50%',
    transform: [{ translateX: -190 }],
    width: 380,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  toastSuccess: {
    backgroundColor: '#10B981',
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  cardLarge: {
    maxWidth: 1100,
    minHeight: 520, // Kutu yassılığını engelleyen, masaüstü için dengeli asgari yükseklik
    padding: 48,
    justifyContent: 'space-between', // İç elemanları dikeyde dengeli yayar
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  formColumn: {
    flexDirection: 'column',
    width: '100%',
  },
  leftCol: {
    flex: 1,
  },
  rightCol: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    width: '100%',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  iconCircleLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  sectionTitleLarge: {
    fontSize: 18,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  sectionSubtitleLarge: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18, // Dikeyde daha geniş, rahat bir yerleşim
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingInfo: {
    flex: 1,
    marginRight: 24,
  },
  settingLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  settingLabelLarge: {
    fontSize: 15,
  },
  settingDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  settingDescLarge: {
    fontSize: 12,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  labelLarge: {
    fontSize: 13.5,
    marginBottom: 8,
  },
  input: {
    fontFamily: FONT_FAMILY,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 13.5,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  inputLarge: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 14.5,
    borderRadius: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    width: '100%',
  },
  backBtn: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: 16,
    width: 150,
  },
  backBtnText: {
    fontFamily: FONT_FAMILY,
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14.5,
  },
  saveBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: 220,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14.5,
  },
});

export default SettingsScreen;
