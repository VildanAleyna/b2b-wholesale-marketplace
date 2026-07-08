import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const severityConfig = {
  high: {
    icon: 'warning',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    label: 'Yüksek',
  },
  medium: {
    icon: 'alert-circle',
    color: '#F97316',
    bg: '#FFF7ED',
    border: '#FED7AA',
    label: 'Orta',
  },
  info: {
    icon: 'information-circle',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    label: 'Bilgi',
  },
  success: {
    icon: 'checkmark-circle',
    color: '#10B981',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    label: 'Normal',
  },
};

const OperationalInsightsPanel = ({ insights, loading, title = 'Akıllı Operasyon Uyarıları', subtitle }) => {
  const alerts = insights?.alerts || [];

  if (loading) {
    return (
      <View style={styles.shell}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>KURAL BAZLI ANALİZ</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#1E3A8A" />
          <Text style={styles.loadingText}>Analizler hazırlanıyor...</Text>
        </View>
      </View>
    );
  }

  if (!alerts.length) {
    return null;
  }

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>KURAL BAZLI ANALİZ</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{alerts.length} Uyarı</Text>
        </View>
      </View>

      <View style={styles.alertGrid}>
        {alerts.slice(0, 4).map((alert, index) => {
          const config = severityConfig[alert.severity] || severityConfig.info;

          return (
            <View
              key={`${alert.type}-${index}`}
              style={[styles.alertCard, { backgroundColor: config.bg, borderColor: config.border }]}
            >
              <View style={styles.alertTop}>
                <View style={[styles.iconBox, { backgroundColor: '#FFFFFF' }]}>
                  <Ionicons name={config.icon} size={18} color={config.color} />
                </View>
                <View style={[styles.severityPill, { borderColor: config.border }]}>
                  <Text style={[styles.severityText, { color: config.color }]}>{config.label}</Text>
                </View>
              </View>

              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>

              <View style={styles.alertFooter}>
                <Text style={[styles.metricText, { color: config.color }]}>{alert.metric}</Text>
                <Text style={styles.actionText}>{alert.action}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  eyebrow: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 4,
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  countText: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '900',
  },
  alertGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  alertCard: {
    flex: 1,
    minWidth: 220,
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    marginHorizontal: 6,
    marginBottom: 10,
  },
  alertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityPill: {
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '900',
  },
  alertTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  alertMessage: {
    color: '#475569',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
    minHeight: 54,
  },
  alertFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.25)',
    paddingTop: 10,
    marginTop: 10,
  },
  metricText: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 3,
  },
  actionText: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 10,
  },
});

export default OperationalInsightsPanel;
