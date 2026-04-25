/**
 * Category card - rounded image + label
 * @format
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const CARD_SIZE = 80;

export default function CategoryCard({ name, image, onPress, categoryId }) {
  const theme = useTheme();

  return (
    <TouchableOpacity 
      style={styles.wrapper} 
      onPress={() => onPress && onPress(categoryId)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.imageWrap,
          {
            backgroundColor: theme.backgroundSecondary,
            shadowColor: theme.text,
            borderColor: theme.border,
          },
        ]}
      >
        <Image source={{ uri: image }} style={styles.image} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', marginHorizontal: 8, width: 80 },
  imageWrap: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  label: { 
    fontSize: 12, 
    marginTop: 6, 
    textAlign: 'center',
    width: 80,
  },
});
