import React, { useState, useEffect, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { fetchEmployees, addEmployee, deleteEmployee } from '../../data/Data';
import { EMPLOYEE_ROLES, EMPLOYEE_ROLE_DETAILS, getEmployeeRoleDetail } from '../../constants/roles';

const FONT_FAMILY = Platform.OS === 'web' 
  ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
  : 'System';

const ROLES = EMPLOYEE_ROLE_DETAILS;

const EmployeesScreen = () => {
  const { user } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Form States
  const [newName, setNewName] = useState('');
  const [selectedRole, setSelectedRole] = useState(EMPLOYEE_ROLES.WAREHOUSE);
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 2500);
  };

  useEffect(() => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    loadEmployees();
  }, [user?._id]);

  const loadEmployees = async () => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchEmployees(user._id);
      if (data && data.employees) {
        setEmployees(data.employees);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error(error);
      setLoadError('Personel listesi alınamadı. API bağlantısını ve toptancı hesabını kontrol edin.');
      showToast('Personel listesi yüklenemedi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!newName.trim()) {
      showToast('Lütfen personel ismi giriniz.', 'error');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 4) {
      showToast('Şifre en az 4 karakter olmalıdır.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const data = await addEmployee(user._id, {
        name: newName.trim(),
        role: selectedRole,
        password: newPassword
      });

      if (data && data.employees) {
        setEmployees(data.employees);
        showToast('Yeni personel başarıyla eklendi.', 'success');
        setModalVisible(false);
        // Reset form
        setNewName('');
        setSelectedRole(EMPLOYEE_ROLES.WAREHOUSE);
        setNewPassword('');
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Personel eklenemedi.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePress = (empName) => {
    if (empName === 'admin') {
      showToast('Ana yönetici (admin) silinemez!', 'error');
      return;
    }

    const confirmMessage = `"${empName}" isimli personeli silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        performDelete(empName);
      }
    } else {
      Alert.alert(
        'Personel Sil',
        confirmMessage,
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Evet, Sil', style: 'destructive', onPress: () => performDelete(empName) }
        ]
      );
    }
  };

  const performDelete = async (empName) => {
    try {
      const data = await deleteEmployee(user._id, empName);
      if (data && data.employees) {
        setEmployees(data.employees);
        showToast('Personel kaydı silindi.', 'success');
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Personel silinirken hata oluştu.';
      showToast(msg, 'error');
    }
  };

  const getRoleBadge = (roleName) => {
    const role = getEmployeeRoleDetail(roleName);
    return (
      <View style={[styles.roleBadge, { backgroundColor: role.bg, borderColor: role.border }]}>
        <Ionicons name={role.icon} size={13} color={role.color} style={{ marginRight: 5 }} />
        <Text style={[styles.roleText, { color: role.color }]}>{role.label}</Text>
      </View>
    );
  };

  const getRole = getEmployeeRoleDetail;

  // Personel ismine göre akıllı rol çözümleme
  const resolveRole = (item) => {
    if (item.name === 'admin' || item.admin) {
      return EMPLOYEE_ROLES.ADMIN;
    }
    return item.role || EMPLOYEE_ROLES.WAREHOUSE;
  };

  const roleCounts = employees.reduce((acc, item) => {
    const roleId = resolveRole(item);
    acc[roleId] = (acc[roleId] || 0) + 1;
    return acc;
  }, {});

  const activeRole = getRole(selectedRole);

  const renderItem = ({ item }) => {
    const resolvedRole = resolveRole(item);
    const role = getRole(resolvedRole);
    return (
      <View style={styles.employeeCard}>
        <View style={styles.cardLeft}>
          <View style={[styles.avatarCircle, { backgroundColor: role.bg }]}>
            <Ionicons name={role.icon} size={18} color={role.color} />
          </View>
          <View style={styles.empInfo}>
            <View style={styles.empTitleRow}>
              <Text style={styles.empName}>{item.name}</Text>
              {item.name === 'admin' || item.admin ? (
                <View style={styles.ownerBadge}>
                  <Ionicons name="shield-checkmark" size={11} color="#1E3A8A" />
                  <Text style={styles.ownerBadgeText}>Ana hesap</Text>
                </View>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              {getRoleBadge(resolvedRole)}
            </View>
            <Text style={styles.permissionPreview}>{role.permissions.join(' • ')}</Text>
          </View>
        </View>

        {item.name !== 'admin' && (
          <TouchableOpacity 
            style={styles.deleteIconBtn} 
            onPress={() => handleDeletePress(item.name)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.contentContainer}>
        {/* Üst Yönetim Alanı */}
        <View style={[styles.headerRow, isLargeScreen && styles.headerRowLarge]}>
          <View>
            <Text style={styles.eyebrow}>Toptancı Operasyon Paneli</Text>
            <Text style={styles.title}>Personel ve Yetki Yönetimi</Text>
            <Text style={styles.subtitle}>Depo, muhasebe ve satış ekibinizin sisteme erişimini buradan yönetin.</Text>
          </View>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.addBtnText}>Yeni Personel Ekle</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.summaryGrid, isLargeScreen && styles.summaryGridLarge]}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Toplam Personel</Text>
            <Text style={styles.summaryValue}>{employees.length}</Text>
            <Text style={styles.summaryHint}>Firma hesabına bağlı aktif kayıt</Text>
          </View>

          {ROLES.slice(0, 3).map((role) => (
            <View key={role.id} style={styles.summaryCard}>
              <View style={styles.summaryRoleHeader}>
                <View style={[styles.summaryIcon, { backgroundColor: role.bg }]}>
                  <Ionicons name={role.icon} size={16} color={role.color} />
                </View>
                <Text style={styles.summaryLabel}>{role.shortLabel}</Text>
              </View>
              <Text style={styles.summaryValue}>{roleCounts[role.id] || 0}</Text>
              <Text style={styles.summaryHint}>{role.description}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={styles.loadingText}>Personel listesi yükleniyor...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="warning-outline" size={54} color="#EF4444" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>Liste alınamadı</Text>
            <Text style={styles.emptyText}>{loadError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadEmployees}>
              <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={employees}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={[styles.listContent, isLargeScreen && styles.listContentLarge]}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={60} color="#CBD5E1" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyTitle}>Henüz personel eklenmedi</Text>
                <Text style={styles.emptyText}>İlk depo, muhasebe veya satış personelinizi ekleyerek firma içi yetki yönetimini başlatın.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Personel Ekleme Modalı */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isLargeScreen && styles.modalContentLarge]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Personel Tanımla</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Personel Adı / Kullanıcı Adı</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: Hasan Yılmaz"
                  placeholderTextColor="#94A3B8"
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Personel Şifresi (Giriş Şifresi)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="En az 4 karakter..."
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={true}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Operasyonel Rol Seçimi</Text>
                <Text style={styles.helperText}>Rol, personelin sistemde hangi operasyonlardan sorumlu olacağını belirler.</Text>
                <View style={styles.rolesGrid}>
                  {ROLES.filter(r => r.id !== EMPLOYEE_ROLES.ADMIN).map((role) => (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.roleSelectBox,
                        selectedRole === role.id && { borderColor: '#1E3A8A', backgroundColor: '#EFF6FF' }
                      ]}
                      onPress={() => setSelectedRole(role.id)}
                    >
                      <Ionicons 
                        name={role.icon} 
                        size={16} 
                        color={selectedRole === role.id ? '#1E3A8A' : '#64748B'} 
                        style={{ marginBottom: 6 }}
                      />
                      <Text style={[
                        styles.roleSelectLabel,
                        selectedRole === role.id && { color: '#1E3A8A', fontWeight: '700' }
                      ]}>
                        {role.label.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.rolePreview, { borderColor: activeRole.border, backgroundColor: activeRole.bg }]}>
                <View style={styles.rolePreviewHeader}>
                  <Ionicons name={activeRole.icon} size={18} color={activeRole.color} style={{ marginRight: 8 }} />
                  <Text style={[styles.rolePreviewTitle, { color: activeRole.color }]}>{activeRole.label}</Text>
                </View>
                <Text style={styles.rolePreviewDescription}>{activeRole.description}</Text>
                <View style={styles.permissionList}>
                  {activeRole.permissions.map((permission) => (
                    <View key={permission} style={styles.permissionPill}>
                      <Ionicons name="checkmark-circle" size={12} color={activeRole.color} style={{ marginRight: 4 }} />
                      <Text style={styles.permissionPillText}>{permission}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleAddEmployee}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.submitBtnText}>Kaydet</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    padding: 24,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: 1000,
    marginBottom: 16,
  },
  headerRowLarge: {
    maxWidth: 1000,
  },
  eyebrow: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#64748B',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12.5,
    color: '#64748B',
  },
  addBtn: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  addBtnText: {
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  summaryGrid: {
    width: '100%',
    maxWidth: 1000,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 18,
  },
  summaryGridLarge: {
    maxWidth: 1000,
  },
  summaryCard: {
    flex: 1,
    minWidth: 210,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 6,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  summaryRoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  summaryLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '800',
  },
  summaryValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    color: '#1E3A8A',
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryHint: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: '#64748B',
    marginTop: 10,
  },
  listContent: {
    width: '100%',
    maxWidth: 1000,
    paddingBottom: 40,
    alignItems: 'center', // Flatlist elemanlarının Web'de düzgün hizalanmasını sağlar
  },
  listContentLarge: {
    maxWidth: 1000,
  },
  employeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: Platform.OS === 'web' ? 1000 : '100%', // Web'de büzüşmeyi önleyip başlıkla tam hizalar
    maxWidth: 1000,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  empInfo: {
    flex: 1,
  },
  empTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  empName: {
    fontFamily: FONT_FAMILY,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 8,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  ownerBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    color: '#1E3A8A',
    fontWeight: '800',
    marginLeft: 3,
  },
  permissionPreview: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 7,
    lineHeight: 16,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  roleText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  deleteIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    maxWidth: 520,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    color: '#334155',
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#1E3A8A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryBtnText: {
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 450,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  modalContentLarge: {
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  helperText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  input: {
    fontFamily: FONT_FAMILY,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 13.5,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  roleSelectBox: {
    flex: 1,
    minWidth: 110,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  roleSelectLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  rolePreview: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: -2,
    marginBottom: 4,
  },
  rolePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rolePreviewTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13.5,
    fontWeight: '900',
  },
  rolePreviewDescription: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 10,
  },
  permissionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
  },
  permissionPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 3,
    marginBottom: 6,
  },
  permissionPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#334155',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cancelBtnText: {
    fontFamily: FONT_FAMILY,
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13.5,
  },
  submitBtn: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  submitBtnText: {
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
});

export default EmployeesScreen;
