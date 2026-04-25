/**
 * Secondary banner - bg image + text overlay only
 * @format
 */

import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { imageUrl } from '../services/productService';
import { secondaryBanner as mockSecondaryBanner } from '../data/mock';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEIGHT = 140;

export default function SecondaryBanner({ banner: bannerProp }) {
  const theme = useTheme();
  const banner = bannerProp && (bannerProp.image || bannerProp.title) ? bannerProp : mockSecondaryBanner;
  const imageUri = imageUrl(banner.image) || banner.image;

  return (
    <View style={[styles.wrapper, { marginHorizontal: 16, marginVertical: 12 }]}>
      <ImageBackground
        source={{ uri: imageUri }}
        style={styles.bg}
        imageStyle={styles.bgImageStyle}
      >
        <View style={[styles.overlay, { backgroundColor: theme.overlayDark }]} />
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.white }]}>
            {banner.title || ''}
          </Text>
          {(banner.tagline || '').trim() ? (
            <Text style={[styles.tagline, { color: theme.white }]}>
              {banner.tagline}
            </Text>
          ) : null}
          <Text style={[styles.subtext, { color: theme.white }]}>
            {banner.subtext || ''}
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  bg: {
    width: SCREEN_WIDTH - 32,
    height: HEIGHT,
    justifyContent: 'center',
    paddingLeft: 20,
    borderRadius: 6,
    overflow: 'hidden',
  },
  bgImageStyle: { borderRadius: 6 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  content: {},
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  tagline: { fontSize: 16, fontWeight: '600', marginBottom: 4, opacity: 0.95 },
  subtext: { fontSize: 14, opacity: 0.9 },
});
