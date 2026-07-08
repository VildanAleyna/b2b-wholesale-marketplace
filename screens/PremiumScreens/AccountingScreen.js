import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { fetchWholesalerAccounts } from '../../data/Data';
import { getResponsiveContentWidth, isWeb } from '../../constants/responsiveLayout';
import { CARD_STYLES, COLORS, FONT_FAMILY } from '../../constants/uiTheme';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import SummaryMetricCard from '../../components/ui/SummaryMetricCard';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('tr-TR')} ₺`;

const AccountingScreen = () => {
  const { user } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 900;
  const webContentWidth = getResponsiveContentWidth(width, 1100);

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadAccounts = async () => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    setError('');
    try {
      const data = await fetchWholesalerAccounts(user._id);
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Cari hesaplar yüklenemedi:', err);
      setError('Cari hesap listesi alınamadı. API bağlantısını kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      loadAccounts();
    }, [user?._id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  };

  const totalDebt = accounts.reduce((sum, account) => sum + (account.currentDebt || 0), 0);
  const totalLimit = accounts.reduce((sum, account) => sum + (account.creditLimit || 0), 0);
  const pendingPayments = accounts.reduce((sum, account) => sum + (account.pendingPaymentTotal || 0), 0);
  const riskAccounts = accounts.filter((account) => {
    const usage = account.creditLimit > 0 ? (account.currentDebt / account.creditLimit) * 100 : 0;
    return usage >= 80;
  }).length;

  const renderAccount = ({ item }) => {
    const customer = item.customer || {};
    const usage = item.creditLimit > 0 ? Math.min(Math.round((item.currentDebt / item.creditLimit) * 100), 100) : 0;
    const isRisky = usage >= 80;

    return (
      <View style={styles.accountCard}>
        <View style={styles.cardHeader}>
          <View style={styles.customerAvatar}>
            <Ionicons name="business-outline" size={20} color="#1E3A8A" />
          </View>
          <View style={styles.customerInfo}>
            <View style={styles.customerTitleRow}>
              <Text style={styles.customerName}>{customer.name || 'Bayi adı yok'}</Text>
              {isRisky ? (
                <View style={styles.riskBadge}>
                  <Ionicons name="warning" size={12} color="#F97316" style={{ marginRight: 4 }} />
                  <Text style={styles.riskBadgeText}>Limit riski</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.customerMeta}>{customer.email || 'E-posta yok'} • {customer.phone || 'Telefon yok'}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Güncel Borç</Text>
            <Text style={styles.metricValueDebt}>{formatMoney(item.currentDebt)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Kredi Limiti</Text>
            <Text style={styles.metricValue}>{formatMoney(item.creditLimit)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Kalan Limit</Text>
            <Text style={styles.metricValueSuccess}>{formatMoney(item.remainingLimit)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Bekleyen Ödeme</Text>
            <Text style={styles.metricValueWarning}>{formatMoney(item.pendingPaymentTotal)}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>Limit kullanım oranı</Text>
            <Text style={[styles.progressValue, isRisky && styles.progressRiskValue]}>%{usage}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${usage}%` }, isRisky && styles.progressRiskFill]} />
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerItem}>
            <Ionicons name="receipt-outline" size={14} color="#64748B" style={{ marginRight: 5 }} />
            <Text style={styles.footerText}>{item.orderCount || 0} sipariş</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="card-outline" size={14} color="#64748B" style={{ marginRight: 5 }} />
            <Text style={styles.footerText}>Tahsilat: {formatMoney(item.approvedPaymentTotal)}</Text>
          </View>
          <Text style={styles.footerText}>
            Son sipariş: {item.lastOrderDate ? new Date(item.lastOrderDate).toLocaleDateString('tr-TR') : 'Yok'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.centerText}>Cari hesaplar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <PageHeader
          eyebrow="Muhasebe Paneli"
          title="Cari Hesaplar ve Tahsilat"
          subtitle="Bayilerinizin borç, limit, tahsilat ve risk durumunu buradan takip edin."
          style={[styles.headerRow, isLargeScreen && styles.headerRowLarge, isWeb && { width: webContentWidth }]}
        />

        <View style={[styles.summaryGrid, isWeb && { width: webContentWidth }]}>
          <SummaryMetricCard label="Toplam Alacak" value={formatMoney(totalDebt)} hint="Bayilerden tahsil edilecek güncel borç" />
          <SummaryMetricCard label="Toplam Limit" value={formatMoney(totalLimit)} hint="Tanımlı cari limit toplamı" />
          <SummaryMetricCard label="Bekleyen Ödeme" value={formatMoney(pendingPayments)} hint="Onay bekleyen ödeme bildirimi" tone="warning" />
          <SummaryMetricCard label="Riskli Bayi" value={riskAccounts} hint="Limit kullanım oranı %80 ve üzeri" tone="warning" />
        </View>

        {error ? (
          <View style={styles.centerState}>
            <Ionicons name="alert-circle-outline" size={56} color="#EF4444" />
            <Text style={styles.centerTitle}>Liste alınamadı</Text>
            <Text style={styles.centerText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadAccounts}>
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={accounts}
            renderItem={renderAccount}
            keyExtractor={(item) => item.customer?._id || item.customer?.email}
            contentContainerStyle={[styles.listContent, isWeb && { width: webContentWidth }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <EmptyState
                icon="folder-open-outline"
                title="Cari hesap bulunamadı"
                subtitle="Bu toptancıya bağlı bayi cari hesabı oluştuğunda burada görünecek."
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    padding: 24,
  },
  headerRow: {
    width: '100%',
    maxWidth: 1100,
    marginBottom: 16,
  },
  headerRowLarge: {
    maxWidth: 1100,
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
  pageTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12.5,
    color: '#64748B',
  },
  summaryGrid: {
    width: '100%',
    maxWidth: 1100,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: 210,
    ...CARD_STYLES.panel,
    padding: 14,
    marginHorizontal: 6,
    marginBottom: 10,
  },
  summaryLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '800',
  },
  summaryValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    color: '#1E3A8A',
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 6,
  },
  summaryValueWarning: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    color: '#F97316',
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 6,
  },
  summaryHint: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  listContent: {
    width: '100%',
    maxWidth: 1100,
    paddingBottom: 120,
  },
  accountCard: {
    width: '100%',
    ...CARD_STYLES.panel,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  customerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  customerName: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '900',
    color: '#1E293B',
    marginRight: 8,
  },
  customerMeta: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  riskBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#F97316',
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    minWidth: 145,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  metricLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '800',
    marginBottom: 5,
  },
  metricValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '900',
  },
  metricValueDebt: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '900',
  },
  metricValueSuccess: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '900',
  },
  metricValueWarning: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: '#F97316',
    fontWeight: '900',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  progressValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '900',
  },
  progressRiskValue: {
    color: '#F97316',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1E3A8A',
    borderRadius: 999,
  },
  progressRiskFill: {
    backgroundColor: '#F97316',
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  footerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 4,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    maxWidth: 520,
  },
  centerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    color: '#334155',
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 6,
    textAlign: 'center',
  },
  centerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#1E3A8A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  retryButtonText: {
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default AccountingScreen;
