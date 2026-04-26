/**
 * Skeleton card component for loading states
 * @format
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function SkeletonCard({ style }) {
  const theme = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.image, { backgroundColor: theme.backgroundSecondary }]} />
      <View style={styles.content}>
        <View style={[styles.title, { backgroundColor: theme.backgroundSecondary }]} />
        <View style={[styles.subtitle, { backgroundColor: theme.backgroundSecondary }]} />
        <View style={[styles.price, { backgroundColor: theme.backgroundSecondary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  content: {
    padding: 8,
  },
  title: {
    width: '80%',
    height: 14,
    borderRadius: 4,
    marginBottom: 6,
  },
  subtitle: {
    width: '60%',
    height: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  price: {
    width: '40%',
    height: 16,
    borderRadius: 4,
  },
});
