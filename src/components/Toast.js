/**
 * Custom toast - appears from top right, auto-hides after 2 seconds.
 * @format
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { hideToast } from '../store/slices/toastSlice';

const TOAST_DURATION_MS = 2000;

const getToastColors = (type, theme) => {
  switch (type) {
    case 'success':
      return {
        background: '#34C759',
        border: '#30D158',
        text: '#fff',
      };
    case 'error':
      return {
        background: '#FF3B30',
        border: '#FF453A',
        text: '#fff',
      };
    case 'warning':
      return {
        background: '#FF9500',
        border: '#FF9F0A',
        text: '#fff',
      };
    default:
      return {
        background: theme.backgroundSecondary || '#2a2a2a',
        border: theme.border,
        text: theme.text,
      };
  }
};

export default function Toast() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { visible, message, type } = useSelector((state) => state.toast);
  const slideAnim = useRef(new Animated.Value(150)).current;

  useEffect(() => {
    if (!visible || !message) return;

    slideAnim.setValue(150);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: 150,
        duration: 250,
        useNativeDriver: true,
      }).start(() => dispatch(hideToast()));
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timer);
  }, [visible, message, slideAnim, dispatch]);

  if (!visible || !message) return null;

  const toastColors = getToastColors(type, theme);

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          top: insets.top + 8,
          backgroundColor: toastColors.background,
          borderColor: toastColors.border,
          shadowColor: toastColors.text,
        },
        { transform: [{ translateX: slideAnim }] },
      ]}
    >
      <Text style={[styles.message, { color: toastColors.text }]} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 16,
    maxWidth: 320,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
  },
});
