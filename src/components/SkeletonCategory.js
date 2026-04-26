/**
 * Skeleton category card component for loading states
 * @format
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function SkeletonCategory({ style }) {
  const theme = useTheme();
  
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.image, { backgroundColor: theme.backgroundSecondary }]} />
      <View style={[styles.name, { backgroundColor: theme.backgroundSecondary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    marginRight: 12,
    alignItems: 'center',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  name: {
    width: '80%',
    height: 12,
    borderRadius: 4,
  },
});
