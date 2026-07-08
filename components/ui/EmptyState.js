import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EmptyState = ({ icon = 'folder-open-outline', title, subtitle, children, iconColor = '#CBD5E1' }) => (
  <View style={styles.container}>
    <Ionicons name={icon} size={58} color={iconColor} style={styles.icon} />
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    maxWidth: 420,
    alignSelf: 'center',
  },
  icon: {
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmptyState;
