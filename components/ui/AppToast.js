import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TOAST_CONFIG = {
  success: {
    icon: 'checkmark-circle',
    backgroundColor: '#10B981',
  },
  error: {
    icon: 'alert-circle',
    backgroundColor: '#EF4444',
  },
  info: {
    icon: 'information-circle',
    backgroundColor: '#334155',
  },
};

const AppToast = ({ visible, message, type = 'info' }) => {
  if (!visible || !message) return null;

  const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;

  return (
    <View style={[styles.toast, { backgroundColor: config.backgroundColor }]}>
      <Ionicons name={config.icon} size={18} color="#FFFFFF" style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10000,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
});

export default AppToast;
