/**
 * Seller Orders Screen - Shows all orders for seller's products
 * @format
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { fetchSellerOrdersAsync, updateOrderStatusAsync } from '../store/slices/ordersSlice';
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

const STATUS_UPDATE_OPTIONS = [
  { value: 'confirmed', label: 'Confirm', color: '#007AFF' },
  { value: 'processing', label: 'Process', color: '#5856D6' },
  { value: 'shipped', label: 'Ship', color: '#34C759' },
  { value: 'delivered', label: 'Deliver', color: '#30D158' },
  { value: 'cancelled', label: 'Cancel', color: '#FF3B30' }
];

export default function SellerOrdersScreen({ navigation, route }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  const { sellerId } = route.params || {};
  const { user } = useSelector((state) => state.auth);
  const orders = useSelector((state) => state.orders.orders);
  const loading = useSelector((state) => state.orders.loading);
  const updating = useSelector((state) => state.orders.updating);
  const pagination = useSelector((state) => state.orders.pagination);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Use sellerId from route params or current user
  const currentSellerId = sellerId || user?._id;

  useEffect(() => {
    if (currentSellerId) {
      loadSellerOrders();
    }
  }, [currentSellerId, selectedStatus]);

  const loadSellerOrders = async (page = 1) => {
    try {
      await dispatch(fetchSellerOrdersAsync({ 
        sellerId: currentSellerId, 
        page, 
        limit: 10, 
        status: selectedStatus 
      }));
    } catch (error) {
      dispatch(showToast({ message: 'Failed to load orders', type: 'error' }));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSellerOrders(1);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages && !loading) {
      loadSellerOrders(pagination.page + 1);
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
              const result = await dispatch(updateOrderStatusAsync({
                orderId: order._id,
                status: newStatus,
                notes: ''
              }));
              
              if (updateOrderStatusAsync.fulfilled.match(result)) {
                dispatch(showToast({ 
                  message: `Order #${order.orderNumber} updated to ${newStatus}`, 
                  type: 'success' 
                }));
                setStatusModalVisible(false);
              } else {
                dispatch(showToast({ 
                  message: result.payload || 'Failed to update order', 
                  type: 'error' 
                }));
              }
            } catch (error) {
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

  const canUpdateStatus = (order) => {
    // Sellers can update status for their orders
    return order.items.some(item => item.seller._id === currentSellerId);
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

      <View style={styles.customerInfo}>
        <Text style={[styles.customerName, { color: theme.text }]}>
          {item.user?.firstName} {item.user?.lastName}
        </Text>
        <Text style={[styles.customerEmail, { color: theme.textSecondary }]}>
          {item.user?.email}
        </Text>
      </View>

      <View style={styles.orderContent}>
        <View style={styles.itemsPreview}>
          {item.items.slice(0, 2).map((orderItem, index) => (
            <View key={index} style={styles.itemPreview}>
              <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                {orderItem.product?.title}
              </Text>
              <Text style={[styles.itemDetails, { color: theme.textSecondary }]}>
                Qty: {orderItem.quantity} × {formatPrice(orderItem.price)}
              </Text>
            </View>
          ))}
          {item.items.length > 2 && (
            <Text style={[styles.moreItemsText, { color: theme.textSecondary }]}>
              +{item.items.length - 2} more item{item.items.length - 2 > 1 ? 's' : ''}
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

      {canUpdateStatus(item) && (
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: theme.primary }]}
          onPress={() => openStatusModal(item)}
        >
          <Text style={styles.statusButtonText}>Update Status</Text>
        </TouchableOpacity>
      )}
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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={48} color={theme.muted} />
      <Text style={[styles.emptyTitle, { color: theme.muted }]}>No Orders Yet</Text>
      <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
        Your order history will appear here once customers start buying your products
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {sellerId ? 'Seller Orders' : 'My Orders'}
        </Text>
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
              data={STATUS_UPDATE_OPTIONS}
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
    marginBottom: 8,
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
  customerInfo: {
    marginBottom: 8,
    paddingLeft: 4,
  },
  customerName: { fontSize: 14, fontWeight: '500' },
  customerEmail: { fontSize: 12, marginTop: 2 },
  orderContent: { marginBottom: 8 },
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
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  statusButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
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
});
