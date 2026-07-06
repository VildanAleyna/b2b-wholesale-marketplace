import React, { useState, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { updateUserProfile } from '../../data/Data';

const FONT_FAMILY = Platform.OS === 'web' 
  ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
  : 'System';

const EditProfileScreen = ({ navigation }) => {
  const { user, setUser } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [companyName, setCompanyName] = useState(user?.companyName || user?.name || '');
  const [authorizedPerson, setAuthorizedPerson] = useState(user?.authorizedPerson || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [taxOffice, setTaxOffice] = useState(user?.taxOffice || '');
  const [taxNumber, setTaxNumber] = useState(user?.taxNumber || '');
  const [address, setAddress] = useState(user?.address || '');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 2500);
  };

  const handleUpdate = async () => {
    if (!companyName.trim()) {
      showToast('Firma Adı alanı boş bırakılamaz.', 'error');
      return;
    }
    if (!authorizedPerson.trim()) {
      showToast('Yetkili Adı Soyadı boş bırakılamaz.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await updateUserProfile(user._id, {
        companyName,
        authorizedPerson,
        taxNumber,
        taxOffice,
        phone,
        address
      });

      if (response && response.user) {
        setUser(response.user);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        
        showToast('Firma profil bilgileriniz başarıyla güncellendi! 🎉', 'success');
        setTimeout(() => {
          navigation.navigate('Home', { screen: 'Profile' });
        }, 1800);
      } else {
        showToast('Profil bilgileri güncellenirken hata oluştu.', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('İşlem sırasında bir hata oluştu.', 'error');
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
          
          {/* Kurumsal Firma Bilgileri Başlık */}
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, isLargeScreen && styles.iconCircleLarge]}>
              <Ionicons name="business" size={isLargeScreen ? 20 : 18} color="#1E3A8A" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.sectionTitle, isLargeScreen && styles.sectionTitleLarge]}>Kurumsal Firma Bilgileri</Text>
              <Text style={[styles.sectionSubtitle, isLargeScreen && styles.sectionSubtitleLarge]}>
                Toptancılarla olan cari ve fatura süreçleriniz için kurumsal bilgilerinizi eksiksiz doldurunuz.
              </Text>
            </View>
          </View>

          {/* İki Kolonlu Form Yerleşimi */}
          <View style={isLargeScreen ? styles.formRow : styles.formColumn}>
            {/* Sol Kolon: Kurumsal Kimlik */}
            <View style={isLargeScreen ? [styles.leftCol, { paddingRight: 40 }] : styles.fullWidth}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, isLargeScreen && styles.labelLarge]}>Firma Adı (Ünvanı)</Text>
                <TextInput
                  style={[styles.input, isLargeScreen && styles.inputLarge]}
                  placeholder="Örn: Ahmet Bayi Gıda Ltd."
                  placeholderTextColor="#94A3B8"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, isLargeScreen && styles.labelLarge]}>Yetkili Adı Soyadı</Text>
                <TextInput
                  style={[styles.input, isLargeScreen && styles.inputLarge]}
                  placeholder="Örn: Ahmet Yılmaz"
                  placeholderTextColor="#94A3B8"
                  value={authorizedPerson}
                  onChangeText={setAuthorizedPerson}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={[styles.label, isLargeScreen && styles.labelLarge]}>Vergi Dairesi</Text>
                  <TextInput
                    style={[styles.input, isLargeScreen && styles.inputLarge]}
                    placeholder="Örn: İkitelli V.D."
                    placeholderTextColor="#94A3B8"
                    value={taxOffice}
                    onChangeText={setTaxOffice}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, isLargeScreen && styles.labelLarge]}>Vergi Numarası / T.C.</Text>
                  <TextInput
                    style={[styles.input, isLargeScreen && styles.inputLarge]}
                    placeholder="Örn: 1234567890"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={taxNumber}
                    onChangeText={setTaxNumber}
                  />
                </View>
              </View>
            </View>

            {/* Sağ Kolon: İletişim & Sevkiyat */}
            <View style={isLargeScreen ? [styles.rightCol, { paddingLeft: 40, borderLeftWidth: 1, borderLeftColor: '#E2E8F0' }] : styles.fullWidth}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, isLargeScreen && styles.labelLarge]}>İletişim Telefon Numarası</Text>
                <TextInput
                  style={[styles.input, isLargeScreen && styles.inputLarge]}
                  placeholder="Örn: +90 555 123 45 67"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, isLargeScreen && styles.labelLarge]}>Fatura & Sevkiyat Adresi</Text>
                <TextInput
                  style={[styles.input, styles.textArea, isLargeScreen && styles.textAreaLarge]}
                  placeholder="Siparişlerinizin teslim edileceği detaylı sevkiyat adresini yazınız..."
                  placeholderTextColor="#94A3B8"
                  multiline={true}
                  numberOfLines={isLargeScreen ? 6 : 4}
                  value={address}
                  onChangeText={setAddress}
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
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>
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
    maxWidth: 1000, // Geniş ekranlarda mükemmel dolgunluk için 1000px yapıldı
    minHeight: 520, // Kutu yassılığını engelleyen, masaüstü için dengeli asgari yükseklik
    padding: 40,
    justifyContent: 'space-between',
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
  inputGroup: {
    marginBottom: 18,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textAreaLarge: {
    minHeight: 128,
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

export default EditProfileScreen;
