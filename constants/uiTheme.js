import { Platform } from 'react-native';

export const COLORS = {
  appBg: '#F8FAFC',
  surface: '#FFFFFF',
  primary: '#1E3A8A',
  text: '#0F172A',
  textSoft: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderSoft: '#F1F5F9',
  warning: '#F97316',
  success: '#10B981',
  danger: '#EF4444',
};

export const FONT_FAMILY = Platform.OS === 'web'
  ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  : 'System';

export const SHADOWS = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  panel: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
};

export const CARD_STYLES = {
  panel: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    ...SHADOWS.card,
  },
  roundedPanel: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    ...SHADOWS.panel,
  },
};
