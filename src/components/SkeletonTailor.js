/**
 * Skeleton tailor card component for loading states
 * @format
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function SkeletonTailor({ style }) {
  const theme = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]} />
      <View style={styles.content}>
        <View style={[styles.name, { backgroundColor: theme.backgroundSecondary }]} />
        <View style={[styles.badge, { backgroundColor: theme.backgroundSecondary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    marginRight: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  content: {
    alignItems: 'center',
  },
  name: {
    width: '70%',
    height: 14,
    borderRadius: 4,
    marginBottom: 6,
  },
  badge: {
    width: '50%',
    height: 12,
    borderRadius: 6,
  },
});
