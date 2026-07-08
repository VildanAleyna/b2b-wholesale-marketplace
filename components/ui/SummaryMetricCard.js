import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const VALUE_COLORS = {
  primary: '#1E3A8A',
  warning: '#F97316',
  success: '#10B981',
  danger: '#EF4444',
};

const SummaryMetricCard = ({ label, value, hint, tone = 'primary', icon }) => (
  <View style={styles.card}>
    <View style={styles.header}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.label}>{label}</Text>
    </View>
    <Text style={[styles.value, { color: VALUE_COLORS[tone] || VALUE_COLORS.primary }]}>{value}</Text>
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 210,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 7,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '800',
  },
  value: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 9,
    marginBottom: 5,
  },
  hint: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
});

export default SummaryMetricCard;
