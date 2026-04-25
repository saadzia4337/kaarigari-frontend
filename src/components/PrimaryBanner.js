/**
 * Primary banner slider - paging, overlay, CTA, dots
 * @format
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { imageUrl } from '../services/productService';
import { bannerSlides as mockBannerSlides } from '../data/mock';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 200;

export default function PrimaryBanner({ slides: slidesProp }) {
  const theme = useTheme();
  const navigation = useNavigation();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const slides = (slidesProp && slidesProp.length > 0) ? slidesProp : mockBannerSlides;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <ImageBackground
        source={{ uri: imageUrl(item.image) || item.image }}
        style={styles.bgImage}
        imageStyle={styles.bgImageStyle}
      >
        <View style={[styles.overlay, { backgroundColor: theme.overlayDark }]} />
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.tagline}>
            {item.tagline}
          </Text>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: theme.white }]}
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={[styles.ctaText, { color: theme.primary }]}>
              {item.cta}
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item, idx) => item.id || String(idx)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      <View style={styles.dots}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === activeIndex ? (theme.primary?.trim?.() || theme.primary) : theme.muted,
                opacity: index === activeIndex ? 1 : 0.5,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 12 },
  slide: { height: BANNER_HEIGHT },
  bgImage: { flex: 1, borderRadius: 6, overflow: 'hidden', marginHorizontal: 16 },
  bgImageStyle: { borderRadius: 6 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 20,
    paddingRight: 80,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    color:'#fff',
    marginBottom: 6,
  },
  tagline: { fontSize: 14, marginBottom: 12 , color:'#fff'},
  cta: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  ctaText: { fontSize: 14, fontWeight: '600' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 24,
    height: 2,
    borderRadius: 4,
  },
});
