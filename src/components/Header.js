/**
 * Header - fav icon left (with badge), logo center, cart right (with badge)
 * @format
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { selectCartCount } from '../store/slices/cartSlice';
import { selectWishlistCount } from '../store/slices/wishlistSlice';
import { selectUnreadAlertCount, selectAllAlerts } from '../store/slices/alertSlice';

const primaryBg = (theme) => theme.primary?.trim?.() || theme.primary;

export default function Header({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const cartCount = useSelector(selectCartCount);
  const favCount = useSelector(selectWishlistCount);
  const unreadAlertCount = useSelector(selectUnreadAlertCount);
  const allAlerts = useSelector(selectAllAlerts);

  // Fallback: Calculate unread count from alerts if API count is 0 but alerts exist
  const calculatedUnreadCount = unreadAlertCount > 0 ? unreadAlertCount : allAlerts.filter(alert => !alert.read).length;

  const goToWishlist = () => navigation?.navigate('Wishlist');
  const goToCart = () => navigation?.navigate('Cart');
  const goToAlerts = () => navigation?.navigate('Alerts');

  const Badge = ({ count }) => {
    return count > 0 ? (
      <View style={[styles.badge, { backgroundColor: theme.yellow }]}>
        <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
      </View>
    ) : null;
  };

  return (
    <SafeAreaView style={{ backgroundColor: primaryBg(theme) }} edges={['top']}>
      <View
        style={[
          styles.header,
          {
            paddingTop: 8,
            paddingBottom: 12,
            backgroundColor: primaryBg(theme),
            borderBottomColor: theme.border,
          },
        ]}
      >
      
      <TouchableOpacity style={styles.iconBtn} onPress={goToWishlist}>
        <Ionicons name="heart-outline" size={24} color="#fff" />
        <Badge count={favCount} />
      </TouchableOpacity>
      <Text style={[styles.logo, { color: '#fff' }]}>Kaarigari</Text>
      <View style={styles.rightIcons}>
        <TouchableOpacity style={styles.iconBtn} onPress={goToAlerts}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          <Badge count={calculatedUnreadCount} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={goToCart}>
          <Ionicons name="cart-outline" size={24} color="#fff" />
          <Badge count={cartCount} />
        </TouchableOpacity>
      </View>
      </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconBtn: { padding: 4, minWidth: 40, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  logo: { fontSize: 20, fontWeight: '700', marginLeft:26 },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#000', fontSize: 11, fontWeight: '700' },
});
