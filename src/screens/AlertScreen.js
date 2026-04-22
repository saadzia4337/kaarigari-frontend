import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert as RNAlert,
  Animated,
  PanResponder,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createApiInstance, deleteAlert, markAlertAsRead } from '../services/orderService';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { setAlerts, selectAllAlerts } from '../store/slices/alertSlice';

const AlertScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const alerts = useSelector(selectAllAlerts);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Count unread alerts
  const unreadCount = alerts.filter(alert => !alert.read).length;

  // Only use focus listener, remove polling since Header handles real-time updates
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('AlertScreen: Screen focused, refreshing alerts...');
      fetchAlerts();
    });

    return unsubscribe;
  }, [navigation]);
  
  // Create maps to store pan values and pan responders for each alert
  const panValues = useRef(new Map()).current;
  const panResponders = useRef(new Map()).current;

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const api = await createApiInstance();
      console.log('AlertScreen: Fetching alerts from API...');
      
      // Fetch real user alerts from backend
      const response = await api.get('/alerts');
      
      if (response.data.success) {
        console.log('AlertScreen: Successfully fetched alerts:', response.data.data);
        dispatch(setAlerts(response.data.data));
      } else {
        console.error('Failed to fetch alerts:', response.data.error);
        RNAlert.alert('Error', 'Failed to load alerts');
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      RNAlert.alert('Error', 'Failed to load alerts');
      
      // Fallback to mock data if API fails
      const mockAlerts = [
        {
          _id: '1',
          orderId: { orderNumber: 'ORD123' },
          message: 'New order placed successfully',
          type: 'order_placed',
          timestamp: new Date().toISOString(),
          read: false,
          sender: { firstName: 'John', lastName: 'Doe' },
          recipient: { firstName: 'Jane', lastName: 'Smith' }
        },
        {
          _id: '2', 
          orderId: { orderNumber: 'ORD124' },
          message: 'Order status updated from pending to confirmed',
          type: 'status_update',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          read: false,
          sender: { firstName: 'Mike', lastName: 'Johnson' },
          recipient: { firstName: 'Jane', lastName: 'Smith' }
        },
        {
          _id: '3',
          orderId: { orderNumber: 'ORD125' },
          message: 'Order cancelled by customer',
          type: 'order_cancelled',
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          read: true,
          sender: { firstName: 'John', lastName: 'Doe' },
          recipient: { firstName: 'Mike', lastName: 'Johnson' }
        },
      ];
      
      dispatch(setAlerts(mockAlerts));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const handleAlertPress = async (alert) => {
  // Mark alert as read if it's unread
  if (!alert.read) {
    console.log('AlertScreen: Tapping unread alert:', alert._id, alert.message);
    try {
      await markAlertAsRead(alert._id);
      // Dispatch markAsRead action
      console.log('AlertScreen: Dispatching markAsRead for alert:', alert._id);
      dispatch(markAsRead(alert._id));
    } catch (error) {
      console.error('AlertScreen: Failed to mark alert as read:', error);
      // Continue with navigation even if marking fails
    }
  } else {
    console.log('AlertScreen: Tapping already read alert:', alert._id, alert.message);
  }
  
  // Navigate to All Orders page when alert is clicked
  navigation.navigate('AllOrders');
};

  const handleDeleteAlert = async (alertId) => {
    try {
      await deleteAlert(alertId);
      // Dispatch deleteAlert action
      dispatch(deleteAlert(alertId));
      RNAlert.alert('Success', 'Alert deleted successfully');
    } catch (error) {
      RNAlert.alert('Error', error || 'Failed to delete alert');
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'order_placed':
        return 'cart-outline';
      case 'status_update':
        return 'refresh-circle-outline';
      case 'order_cancelled':
        return 'close-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'order_placed':
        return theme.primary;
      case 'status_update':
        return '#4CAF50';
      case 'order_cancelled':
        return '#F44336';
      default:
        return theme.muted;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  const renderAlertItem = ({ item }) => {
  // Get or create pan value for this specific alert
  let pan = panValues.get(item._id);
  if (!pan) {
    pan = new Animated.ValueXY();
    panValues.set(item._id, pan);
  }
  
  // Get or create pan responder for this specific alert
  let panResponder = panResponders.get(item._id);
  if (!panResponder) {
    panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Allow both left and right swipes
        if (gestureState.dx < 0) {
          // Left swipe with resistance (show delete button)
          const resistance = Math.max(gestureState.dx * 0.3, gestureState.dx);
          pan.setValue({ x: resistance, y: 0 });
        } else if (gestureState.dx > 0) {
          // Right swipe (hide delete button) - allow full movement
          const currentValue = pan.x._value || 0;
          const newValue = Math.min(currentValue + gestureState.dx * 0.5, 0); // Don't go past 0
          pan.setValue({ x: newValue, y: 0 });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Get current pan value
        const currentValue = pan.x._value || 0;
        
        if (gestureState.dx < -50) {
          // Swiped far enough left - show delete button
          Animated.spring(pan, {
            toValue: { x: -60, y: 0 }, // Match smaller button width
            tension: 100,
            friction: 8,
            useNativeDriver: false,
          }).start();
        } else if (gestureState.dx > 30 || currentValue > -15) {
          // Swiped right or not far enough left - reset to original position
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            tension: 100,
            friction: 8,
            useNativeDriver: false,
          }).start();
        } else {
          // Small left swipe - keep delete button hidden
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            tension: 100,
            friction: 8,
            useNativeDriver: false,
          }).start();
        }
      },
    });
    panResponders.set(item._id, panResponder);
  }
  
  const handleDelete = () => {
    Animated.timing(pan, {
      toValue: { x: -300, y: 0 },
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      handleDeleteAlert(item._id);
      // Clean up pan value and responder after deletion
      panValues.delete(item._id);
      panResponders.delete(item._id);
    });
  };

  return (
    <View style={styles.alertContainer}>
      <Animated.View
        style={[
          styles.alertItem,
          { 
            borderLeftColor: getAlertColor(item.type), 
            opacity: item.read ? 0.6 : 1,
            transform: [{ translateX: pan.x }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={styles.alertContentWrapper}
          onPress={() => handleAlertPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.alertIcon}>
            <Ionicons 
              name={getAlertIcon(item.type)} 
              size={20} 
              color={getAlertColor(item.type)} 
            />
          </View>
          <View style={styles.alertContent}>
            <Text style={[styles.alertMessage, { color: theme.text, fontWeight: item.read ? 'normal' : '600' }]}>
              {item.message}
            </Text>
            <Text style={[styles.alertMeta, { color: theme.textSecondary }]}>
              Order #{item.orderId?.orderNumber || item.orderId} {formatTime(item.timestamp)}
            </Text>
            {item.sender && (
              <Text style={[styles.alertSender, { color: theme.textSecondary }]}>
                From: {item.sender.firstName} {item.sender.lastName}
              </Text>
            )}
          </View>
          {!item.read && (
            <View style={styles.unreadIndicator} />
          )}
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.deleteButton,
          {
            transform: [{ translateX: pan.x }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButtonInner}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Order Alerts
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.alertCountBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.alertCountText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Stay updated with your order activities
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading alerts...
          </Text>
        </View>
      )}

      {!loading && (
        <FlatList
        data={alerts}
        renderItem={renderAlertItem}
        keyExtractor={(item) => item._id || item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.background, theme.primary]}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="notifications-off-outline" 
              size={48} 
              color={theme.muted} 
            />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No alerts yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Alerts will appear here when orders are placed or updated
            </Text>
          </View>
        }
      />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  alertCountBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  alertCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  alertItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  alertContentWrapper: {
    flexDirection: 'row',
    flex: 1,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
    justifyContent: 'center',
  },
  alertMessage: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 22,
  },
  alertMeta: {
    fontSize: 13,
    opacity: 0.8,
  },
  alertSender: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  alertContainer: {
    position: 'relative',
    marginBottom: 12,
    overflow: 'hidden',
  },
  deleteButton: {
    position: 'absolute',
    right: -60, // Start hidden off-screen (smaller button)
    top: 0,
    bottom: 0,
    width: 60, // Smaller width
    height:60,
    marginTop:30,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: 8, // Increased gap between card and button
  },
  deleteButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4, // Smaller padding
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 10, // Smaller font
    fontWeight: '600',
    marginTop: 1, // Smaller margin
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default AlertScreen;
