/**
 * Header - fav icon left (with badge), logo center, cart right (with badge)
 * @format
 */

import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { selectCartCount } from '../store/slices/cartSlice';
import { selectWishlistCount } from '../store/slices/wishlistSlice';
import { selectUnreadAlertCount, selectAllAlerts, setUnreadCount, setAlerts } from '../store/slices/alertSlice';
import { getUnreadAlertCount, createApiInstance } from '../services/orderService';

const primaryBg = (theme) => theme.primary?.trim?.() || theme.primary;

export default function Header({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const cartCount = useSelector(selectCartCount);
  const favCount = useSelector(selectWishlistCount);
  const unreadAlertCount = useSelector(selectUnreadAlertCount);
  const allAlerts = useSelector(selectAllAlerts);
  const dispatch = useDispatch();

  // Fallback: Calculate unread count from alerts if API count is 0 but alerts exist
  const calculatedUnreadCount = unreadAlertCount > 0 ? unreadAlertCount : allAlerts.filter(alert => !alert.read).length;

  // Debug: Log all alert-related data
  console.log('Header - unreadAlertCount:', unreadAlertCount);
  console.log('Header - allAlerts length:', allAlerts.length);
  console.log('Header - allAlerts:', allAlerts);
  console.log('Header - calculatedUnreadCount:', calculatedUnreadCount);
  console.log('Header - should show badge?', calculatedUnreadCount > 0);
  
  // Add debug log to track when component re-renders
  useEffect(() => {
    console.log('Header: Component re-rendered, unread count:', unreadAlertCount);
  }, [unreadAlertCount]); // Re-render when count changes

  // Fetch unread alert count periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        console.log('Header: Fetching unread count...');
        const response = await getUnreadAlertCount();
        console.log('Header: API response:', response);
        
        // Handle different response structures
        let count = 0;
        if (response?.data !== undefined) {
          if (typeof response.data === 'object' && response.data.data !== undefined) {
            count = response.data.data;
          } else {
            count = response.data;
          }
        } else if (response !== undefined) {
          count = response;
        }
        
        console.log('Header: Extracted count:', count);
        dispatch(setUnreadCount(count));
      } catch (error) {
        console.error('Header: Failed to fetch unread count:', error);
      }
    };

    // Fetch alerts data on mount to ensure we have alert data
    const fetchAlerts = async () => {
      try {
        console.log('Header: Fetching alerts data...');
        const api = await createApiInstance();
        const response = await api.get('/alerts');
        
        if (response.data.success) {
          console.log('Header: Successfully fetched alerts:', response.data.data);
          dispatch(setAlerts(response.data.data));
        }
      } catch (error) {
        console.error('Header: Failed to fetch alerts:', error);
      }
    };

    // Fetch immediately on mount
    fetchUnreadCount();
    fetchAlerts();
    
    // Set up polling for new alerts
    const interval = setInterval(fetchUnreadCount, 5000); // Check every 5 seconds
    
    return () => {
      console.log('Header: Cleaning up unread count polling');
      clearInterval(interval);
    };
  }, []); // Empty dependency array - only run once

  const goToWishlist = () => navigation?.navigate('Wishlist');
  const goToCart = () => navigation?.navigate('Cart');
  const goToAlerts = () => navigation?.navigate('Alerts');

  const Badge = ({ count }) => {
    console.log('Badge component - count:', count, 'should show:', count > 0);
    return count > 0 ? (
      <View style={[styles.badge, { backgroundColor: primaryBg(theme) }]}>
        <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
      </View>
    ) : null;
  };

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
        },
      ]}
    >
      
      <TouchableOpacity style={styles.iconBtn} onPress={goToWishlist}>
        <Ionicons name="heart-outline" size={24} color={theme.primary} />
        <Badge count={favCount} />
      </TouchableOpacity>
      <Text style={[styles.logo, { color: theme.text }]}>Kaarigari</Text>
      <View style={styles.rightIcons}>
        <TouchableOpacity style={styles.iconBtn} onPress={goToAlerts}>
          <Ionicons name="notifications-outline" size={24} color={theme.primary} />
          <Badge count={calculatedUnreadCount} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={goToCart}>
          <Ionicons name="cart-outline" size={24} color={theme.primary} />
          <Badge count={cartCount} />
        </TouchableOpacity>
      </View>
    </View>
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
  logo: { fontSize: 20, fontWeight: '700' },
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
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
