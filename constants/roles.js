export const USER_ACCOUNT_TYPES = {
  CUSTOMER: 'customer',
  WHOLESALER_ADMIN: 'wholesalerAdmin',
  EMPLOYEE: 'employee',
};

export const EMPLOYEE_ROLES = {
  WAREHOUSE: 'Depo Görevlisi',
  ACCOUNTING: 'Muhasebe',
  SALES: 'Satış Temsilcisi',
  ADMIN: 'admin',
};

export const EMPLOYEE_ROLE_DETAILS = [
  {
    id: EMPLOYEE_ROLES.WAREHOUSE,
    label: 'Depo Görevlisi',
    shortLabel: 'Depo',
    description: 'Sipariş hazırlama, stok ve sevkiyat operasyonlarını takip eder.',
    permissions: ['Sipariş hazırlama', 'Stok takibi', 'Kargo süreci'],
    icon: 'cube',
    color: '#F97316',
    bg: '#FFF7ED',
    border: '#FFEDD5',
  },
  {
    id: EMPLOYEE_ROLES.ACCOUNTING,
    label: 'Muhasebe Sorumlusu',
    shortLabel: 'Muhasebe',
    description: 'Cari hesap, ödeme bildirimi ve tahsilat süreçlerini yönetir.',
    permissions: ['Ödeme onayı', 'Cari takip', 'Ekstre kontrolü'],
    icon: 'calculator',
    color: '#10B981',
    bg: '#F0FDF4',
    border: '#DCFCE7',
  },
  {
    id: EMPLOYEE_ROLES.SALES,
    label: 'Satış / Plasiyer',
    shortLabel: 'Satış',
    description: 'Bayi ilişkileri, sipariş takibi ve müşteri operasyonlarını yürütür.',
    permissions: ['Bayi takibi', 'Sipariş izleme', 'Müşteri ilişkileri'],
    icon: 'briefcase',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#EDE9FE',
  },
  {
    id: EMPLOYEE_ROLES.ADMIN,
    label: 'Yönetici (Admin)',
    shortLabel: 'Admin',
    description: 'Firma hesabı, personel ve tüm operasyonel ayarları yönetir.',
    permissions: ['Tam yetki', 'Personel yönetimi', 'Firma ayarları'],
    icon: 'shield-checkmark',
    color: '#1E3A8A',
    bg: '#EFF6FF',
    border: '#DBEAFE',
  },
];

export const getEmployeeRoleDetail = (roleId) => (
  EMPLOYEE_ROLE_DETAILS.find(role => role.id === roleId) || EMPLOYEE_ROLE_DETAILS[0]
);
