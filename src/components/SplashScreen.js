/**
 * Splash screen overlay - shows logo until app is ready
 * @format
 */

import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';

const splashImage = require('../assets/images/splash.png');

const SPLASH_DURATION_MS = 2500;

export default function SplashScreen({ onFinish, children }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, [onFinish]);

  if (!visible) {
    return children;
  }

  return (
    <View style={styles.container}>
      <Image source={splashImage} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f0eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '90%',
    maxWidth: 400,
    height: '70%',
    maxHeight: 500,
  },
});
