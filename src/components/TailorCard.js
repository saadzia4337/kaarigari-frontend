/**
 * Tailor card - circular avatar + label (Best tailors)
 * @format
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const SIZE = 60;

export default function TailorCard({ name, image, seller, onPress }) {
  const theme = useTheme();
  const Wrapper = onPress ? TouchableOpacity : View;

  const primary = theme.primary?.trim?.() || theme.primary;
  return (
    <Wrapper
      style={[
        styles.wrapper,
        { marginHorizontal: 10 },
      ]}
      onPress={() => onPress?.(seller)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatarWrap, { borderColor: primary, borderWidth: 2 }]}>
        <Image source={{ uri: image }} style={styles.avatar} />
      </View>
      <Text style={[styles.label, { color: theme.textSecondary }]} numberOfLines={1}>
        {name}
      </Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', width: 68, paddingVertical: 8, paddingHorizontal: 4 },
  avatarWrap: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  label: { fontSize: 12, marginTop: 6, textAlign: 'center' },
});
