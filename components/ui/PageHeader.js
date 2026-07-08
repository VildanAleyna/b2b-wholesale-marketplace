import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const PageHeader = ({ eyebrow, title, subtitle, rightContent, style }) => (
  <View style={[styles.header, style]}>
    <View style={styles.textGroup}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {rightContent ? <View style={styles.rightContent}>{rightContent}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  header: {
    width: '100%',
    marginBottom: 16,
  },
  textGroup: {
    flexShrink: 1,
  },
  eyebrow: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  rightContent: {
    marginTop: 10,
  },
});

export default PageHeader;
