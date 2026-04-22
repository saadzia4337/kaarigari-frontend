/**
 * My Orders Screen - User view of their orders with status tracking
 * @format
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { fetchOrdersAsync, cancelOrderAsync } from '../store/slices/ordersSlice';
import { showToast } from '../store/slices/toastSlice';
import { formatPrice, formatOrderDate } from '../services/orderService';

const STATUS_OPTIONS = [
  { value: null, label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function MyOrdersScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Check if user is authenticated
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Orders</Text>
        </View>
        <View style={styles.authRequiredContainer}>
          <Ionicons name="lock-closed-outline" size={48} color={theme.muted} />
          <Text style={[styles.authRequiredTitle, { color: theme.muted }]}>Login Required</Text>
          <Text style={[styles.authRequiredSubtitle, { color: theme.muted }]}>
            Please login to view your orders
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const orders = useSelector((state) => state.orders.orders);
  const loading = useSelector((state) => state.orders.loading);
  const cancelling = useSelector((state) => state.orders.cancelling);
  const pagination = useSelector((state) => state.orders.pagination);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [selectedStatus]);

  const loadOrders = async (page = 1) => {
    try {
      await dispatch(fetchOrdersAsync({ page, limit: 10, status: selectedStatus }));
    } catch (error) {
      dispatch(showToast({ message: 'Failed to load orders', type: 'error' }));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders(1);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages && !loading) {
      loadOrders(pagination.page + 1);
    }
  };

  const handleCancelOrder = (order) => {
    Alert.alert(
      'Cancel Order',
      `Are you sure you want to cancel order #${order.orderNumber}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await dispatch(cancelOrderAsync({
                orderId: order._id,
                reason: 'Cancelled by customer'
              }));
              
              if (cancelOrderAsync.fulfilled.match(result)) {
                dispatch(showToast({ 
                  message: `Order #${order.orderNumber} cancelled`, 
                  type: 'success' 
                }));
              } else {
                dispatch(showToast({ 
                  message: result.payload || 'Failed to cancel order', 
                  type: 'error' 
                }));
              }
            } catch (error) {
              dispatch(showToast({ message: 'Failed to cancel order', type: 'error' }));
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: '#FFA500',
      confirmed: '#007AFF',
      processing: '#5856D6',
      shipped: '#34C759',
      delivered: '#30D158',
      cancelled: '#FF3B30'
    };
    return colorMap[status] || '#8E8E93';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      pending: 'time-outline',
      confirmed: 'checkmark-circle-outline',
      processing: 'cog-outline',
      shipped: 'car-outline',
      delivered: 'checkmark-done-circle-outline',
      cancelled: 'close-circle-outline'
    };
    return iconMap[status] || 'help-circle-outline';
  };

  const canCancelOrder = (order) => {
    return order.status === 'pending';
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={[styles.orderNumber, { color: theme.text }]}>
            #{item.orderNumber}
          </Text>
          <Text style={[styles.orderDate, { color: theme.textSecondary }]}>
            {formatOrderDate(item.orderDate)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={12} 
            color="#fff" 
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.orderContent}>
        <View style={styles.itemsPreview}>
          {item.items.slice(0, 3).map((orderItem, index) => (
            <View key={index} style={styles.itemPreview}>
              <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                {orderItem.product?.title}
              </Text>
              <Text style={[styles.itemDetails, { color: theme.textSecondary }]}>
                Qty: {orderItem.quantity} × {formatPrice(orderItem.price)}
              </Text>
            </View>
          ))}
          {item.items.length > 3 && (
            <Text style={[styles.moreItemsText, { color: theme.textSecondary }]}>
              +{item.items.length - 3} more item{item.items.length - 3 > 1 ? 's' : ''}
            </Text>
          )}
        </View>
        
        <View style={styles.orderSummary}>
          <Text style={[styles.itemsCount, { color: theme.textSecondary }]}>
            {item.items.length} item{item.items.length > 1 ? 's' : ''}
          </Text>
          <Text style={[styles.orderTotal, { color: theme.text }]}>
            {formatPrice(item.totalAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <Text style={[styles.deliveryInfo, { color: theme.textSecondary }]}>
          {item.shippingAddress?.city}, {item.shippingAddress?.area}
        </Text>
        {canCancelOrder(item) && (
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: '#FF3B30' }]}
            onPress={() => handleCancelOrder(item)}
            disabled={cancelling}
          >
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderStatusOption = ({ item: statusOption }) => (
    <TouchableOpacity
      style={[
        styles.statusOption,
        selectedStatus === statusOption.value && { backgroundColor: theme.primary }
      ]}
      onPress={() => setSelectedStatus(statusOption.value)}
    >
      <Text style={[
        styles.statusOptionText,
        { color: selectedStatus === statusOption.value ? '#fff' : theme.text }
      ]}>
        {statusOption.label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={48} color={theme.muted} />
      <Text style={[styles.emptyTitle, { color: theme.muted }]}>No Orders Yet</Text>
      <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
        Your order history will appear here once you start shopping
      </Text>
      <TouchableOpacity
        style={[styles.shopButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('MainTabs')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Orders</Text>
      </View>

      <View style={styles.filterSection}>
        <FlatList
          data={STATUS_OPTIONS}
          renderItem={renderStatusOption}
          keyExtractor={(item) => item.value || 'all'}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  filterSection: { paddingHorizontal: 16, paddingVertical: 8 },
  filterList: { paddingRight: 16 },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  statusOptionText: { fontSize: 14, fontWeight: '600' },
  ordersList: { paddingHorizontal: 16, paddingBottom: 20 },
  orderCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: { flex: 1 },
  orderNumber: { fontSize: 16, fontWeight: '600' },
  orderDate: { fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: { marginRight: 4 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  orderContent: { marginBottom: 12 },
  itemsPreview: { marginBottom: 8 },
  itemPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: { 
    flex: 1, 
    fontSize: 14, 
    marginRight: 8,
  },
  itemDetails: { fontSize: 12 },
  moreItemsText: { fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  itemsCount: { fontSize: 12 },
  orderTotal: { fontSize: 16, fontWeight: '600' },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryInfo: { fontSize: 12, flex: 1 },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  cancelButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  emptySubtitle: { 
    fontSize: 14, 
    textAlign: 'center', 
    marginTop: 8, 
    marginBottom: 24 
  },
  shopButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  shopButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  authRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authRequiredTitle: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  authRequiredSubtitle: { 
    fontSize: 14, 
    textAlign: 'center', 
    marginTop: 8, 
    marginBottom: 24 
  },
  loginButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
