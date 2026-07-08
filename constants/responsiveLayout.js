import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';

export const WEB_LAYOUT = {
  narrow: 520,
  form: 640,
  content: 1000,
  wide: 1280,
  pageGutter: 64,
};

export const getResponsiveContentWidth = (windowWidth, maxWidth = WEB_LAYOUT.wide) => {
  if (!isWeb) return '100%';
  return Math.min(Math.max(windowWidth - WEB_LAYOUT.pageGutter, 320), maxWidth);
};

export const getTwoColumnCardWidth = (windowWidth, options = {}) => {
  if (!isWeb) return '100%';

  const {
    maxContentWidth = WEB_LAYOUT.wide,
    gap = 20,
    minCardWidth = 420,
    maxCardWidth = 630,
  } = options;

  const contentWidth = getResponsiveContentWidth(windowWidth, maxContentWidth);
  const cardWidth = (contentWidth - gap) / 2;

  return Math.min(Math.max(cardWidth, minCardWidth), maxCardWidth);
};

export const getModalWidth = (windowWidth, maxWidth = WEB_LAYOUT.form) => {
  if (!isWeb) return '90%';
  return Math.min(Math.max(windowWidth - 48, 320), maxWidth);
};
