/**
 * All Orders Screen - Admin view of all orders with filtering and status updates
 * @format
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { fetchOrdersAsync, fetchSellerOrdersAsync, updateOrderStatusAsync } from '../store/slices/ordersSlice';
import { updateSellerOrderStatus } from '../services/orderService';
import { showToast } from '../store/slices/toastSlice';
import { formatPrice, formatOrderDate } from '../services/orderService';
import { getImageUrl } from '../config/api';
import { captureScreen } from 'react-native-view-shot';

const STATUS_OPTIONS = [
  { value: null, label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const getStatusUpdateOptions = (userRole, currentStatus) => {
  if (userRole === 'admin') {
    return [
      { value: 'confirmed', label: 'Confirm', color: '#007AFF' },
      { value: 'processing', label: 'Process', color: '#5856D6' },
      { value: 'shipped', label: 'Ship', color: '#34C759' },
      { value: 'delivered', label: 'Deliver', color: '#30D158' },
      { value: 'cancelled', label: 'Cancel', color: '#FF3B30' }
    ];
  } else if (userRole === 'seller') {
    return [
      { value: 'confirmed', label: 'Confirm', color: '#007AFF' },
      { value: 'processing', label: 'Process', color: '#5856D6' },
      { value: 'shipped', label: 'Ship', color: '#34C759' },
      { value: 'delivered', label: 'Deliver', color: '#30D158' }
    ];
  } else if (userRole === 'buyer') {
    return [
      { value: 'cancelled', label: 'Cancel Order', color: '#FF3B30' }
    ];
  }
  return [];
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  authRequiredContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  authRequiredTitle: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  authRequiredSubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  loginButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
  orderNumber: { fontSize: 16, fontWeight: '600' },
  orderDate: { fontSize: 12, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  orderInfo: { marginBottom: 12 },
  customerName: { fontSize: 14, fontWeight: '500' },
  customerEmail: { fontSize: 12, marginTop: 2 },
  orderItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemsText: { fontSize: 12 },
  orderTotal: { fontSize: 16, fontWeight: '600' },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  statusButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  orderItemsPreview: {
    marginBottom: 12,
  },
  orderItemImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
    overflow: 'hidden',
  },
  orderItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  orderItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  orderItemTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  orderItemPrice: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemsCount: { fontSize: 12 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: { fontSize: 16, marginTop: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  statusUpdateList: { paddingBottom: 20 },
  statusUpdateOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  statusUpdateOptionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: { marginLeft: 8 },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  buttonIcon: {
    marginRight: 8,
  },
});

export default function AllOrdersScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const dynamicStyles = getDynamicStyles(theme);
  
  // Check if user is authenticated
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Screenshot function for sellers
  const takeScreenshot = async () => {
    if (user?.role === 'seller') {
      try {
        const screenshot = await captureScreen({
          format: "png",
          quality: 0.8,
          result: "tmpfile"
        });
        console.log('Screenshot taken:', screenshot);
        dispatch(showToast({ message: 'Screenshot saved successfully', type: 'success' }));
      } catch (error) {
        console.error('Screenshot error:', error);
        dispatch(showToast({ message: 'Failed to take screenshot', type: 'error' }));
      }
    }
  };
  
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>All Orders</Text>
        </View>
        <View style={styles.authRequiredContainer}>
          <Ionicons name="lock-closed-outline" size={48} color={theme.muted} />
          <Text style={[styles.authRequiredTitle, { color: theme.muted }]}>Login Required</Text>
          <Text style={[styles.authRequiredSubtitle, { color: theme.muted }]}>
            Please login to access your orders
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
  const updating = useSelector((state) => state.orders.updating);
  const pagination = useSelector((state) => state.orders.pagination);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [selectedStatus]);

  const loadOrders = async (page = 1) => {
    try {
      if (user?.role === 'seller') {
        // Load seller-specific orders
        await dispatch(fetchSellerOrdersAsync({ 
          sellerId: user._id, 
          page, 
          limit: 10, 
          status: selectedStatus 
        }));
      } else if (user?.role === 'admin') {
        // Load all orders for admin
        await dispatch(fetchOrdersAsync({ page, limit: 10, status: selectedStatus }));
      } else {
        // Load user's own orders for buyers
        await dispatch(fetchOrdersAsync({ page, limit: 10, status: selectedStatus }));
      }
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

  const handleStatusUpdate = async (order, newStatus) => {
    Alert.alert(
      'Update Order Status',
      `Are you sure you want to update order #${order.orderNumber} to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              // Update local state immediately for better UX
              dispatch({
                type: 'orders/updateOrderInList',
                payload: { ...order, status: newStatus }
              });
              
              let result;
              
              // Handle different user roles
              if (user?.role === 'seller') {
                result = await updateSellerOrderStatus(order._id, newStatus, '');
              } else if (user?.role === 'admin') {
                result = await dispatch(updateOrderStatusAsync({
                  orderId: order._id,
                  status: newStatus,
                  notes: ''
                }));
              } else if (user?.role === 'buyer') {
                // Buyers can only cancel orders
                if (newStatus === 'cancelled') {
                  result = await dispatch(cancelOrderAsync({
                    orderId: order._id,
                    reason: 'Cancelled by customer'
                  }));
                } else {
                  throw new Error('Buyers can only cancel orders');
                }
              }
              
              // Always show success and close modal for better UX
              dispatch(showToast({ 
                message: `Order updated to ${newStatus}`, 
                type: 'success' 
              }));
              setStatusModalVisible(false);
              
              // If API call failed, the state will be updated on next refresh
              if (!result.dispatch) {
                console.log('API call failed, but state updated optimistically');
                // Don't show error to user since update will be reflected on refresh
              }
            } catch (error) {
              // Revert local state if API call fails
              dispatch({
                type: 'orders/updateOrderInList',
                payload: order
              });
              dispatch(showToast({ message: 'Failed to update order', type: 'error' }));
            }
          }
        }
      ]
    );
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
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

  const renderOrderItem = ({ item }) => {
 

  return (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={[styles.orderNumber, { color: theme.text }]}>
            #{item.orderNumber || 'N/A'}
          </Text>
          <Text style={[styles.orderDate, { color: theme.textSecondary }]}>
            {item.orderDate ? formatOrderDate(item.orderDate) : 'No date'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{(item.status || 'unknown').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <Text style={[styles.customerName, { color: theme.text }]}>
          {item.user?.firstName || 'N/A'} {item.user?.lastName || ''}
        </Text>
        <Text style={[styles.customerEmail, { color: theme.textSecondary }]}>
          {item.user?.email || 'N/A'}
        </Text>
      </View>

      {/* Order Items Preview */}
      {item.items && item.items.length > 0 && (
        <View style={styles.orderItemsPreview}>
          {item.items.slice(0, 2).map((orderItem, index) => (
            <View key={index} style={dynamicStyles.orderItemPreview}>
              <View style={styles.orderItemImageContainer}>
                {orderItem.product?.images?.length > 0 ? (
                  <Image 
                    source={{ uri: getImageUrl(orderItem.product.images[0]) }} 
                    style={styles.orderItemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.orderItemImagePlaceholder, { backgroundColor: theme.muted }]}>
                    <Ionicons name="image-outline" size={16} color={theme.textSecondary} />
                  </View>
                )}
              </View>
              <View style={styles.orderItemInfo}>
                <Text style={[styles.orderItemTitle, { color: theme.text }]} numberOfLines={1}>
                  {orderItem.product?.title || `Product ${index + 1}`}
                </Text>
                <Text style={[styles.orderItemPrice, { color: theme.text }]}>
                  {formatPrice(orderItem.price)}
                </Text>
                <Text style={dynamicStyles.orderItemQuantity}>
                  Qty: {orderItem.quantity}
                </Text>
                
              </View>
            </View>
          ))}
          {item.items.length > 2 && (
            <Text style={dynamicStyles.moreItemsText}>
              +{item.items.length - 2} more items
            </Text>
          )}
        </View>
      )}

      

      <View style={dynamicStyles.orderSummary}>
        <Text style={[styles.itemsCount, { color: theme.textSecondary }]}>
          {item.items?.length || 0} items
        </Text>
        <Text style={[styles.orderTotal, { color: theme.text }]}>
          {formatPrice(item.totalAmount || 0)}
        </Text>
      </View>

      {/* Show Update Status button based on user role */}
      {(() => {
        // Debug seller access check
        const isAdmin = user?.role === 'admin';
        const isSeller = user?.role === 'seller';
        const hasSellerProducts = isSeller && item.items?.some(orderItem => {
          const sellerId = orderItem.seller;
        
          
          // Try multiple approaches to match seller ID
          if (sellerId === user._id) {
            console.log('Direct match found');
            return true;
          }
          
          if (typeof sellerId === 'string' && sellerId.includes('{')) {
            try {
              const parsed = JSON.parse(sellerId);
              if (parsed._id === user._id) {
                console.log('JSON parse match found');
                return true;
              }
            } catch (error) {
              console.log('JSON parse failed, trying regex');
              // Try regex extraction
              const objectIdMatch = sellerId.match(/ObjectId\('([^']+)'\)/);
              if (objectIdMatch && objectIdMatch[1] === user._id) {
                console.log('Regex match found');
                return true;
              }
            }
          }
          
          return false;
        });
        
        const shouldShowButton = isAdmin || isSeller || 
          (user?.role === 'buyer' && item.user?._id === user._id && item.status === 'pending');
        
        
            
        
        return shouldShowButton;
      })() && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => openStatusModal(item)}
          >
            <Ionicons name="sync-outline" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Update Status</Text>
          </TouchableOpacity>
                  </View>
      )}
    </TouchableOpacity>
  );
};

  const renderStatusOption = ({ item: statusOption }) => {
  const isSelected = selectedStatus === statusOption.value;
  
  return (
    <TouchableOpacity
      style={[
        styles.statusOption,
        isSelected && { backgroundColor: theme.primary }
      ]}
      onPress={() => setSelectedStatus(statusOption.value)}
    >
      <Text style={[
        styles.statusOptionText,
        { color: isSelected ? '#fff' : theme.text }
      ]}>
        {statusOption.label}
      </Text>
    </TouchableOpacity>
  );
};

  const renderStatusUpdateOption = ({ item: option }) => (
    <TouchableOpacity
      style={[styles.statusUpdateOption, { backgroundColor: option.color }]}
      onPress={() => {
        handleStatusUpdate(selectedOrder, option.value);
        setStatusModalVisible(false);
      }}
    >
      <Text style={styles.statusUpdateOptionText}>{option.label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>All Orders</Text>
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={theme.muted} />
            <Text style={[styles.emptyText, { color: theme.muted }]}>No orders found</Text>
          </View>
        }
      />

      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Update Order #{selectedOrder?.orderNumber}
              </Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={getStatusUpdateOptions(user?.role, selectedOrder?.status)}
              renderItem={renderStatusUpdateOption}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.statusUpdateList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getDynamicStyles = (theme) => StyleSheet.create({
  orderItemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: theme.background,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  orderItemImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItemQuantity: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  moreItemsText: {
    fontSize: 10,
    color: theme.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
});
