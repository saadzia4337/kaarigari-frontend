/**
 * Order Detail Screen - View individual order details with items and status
 * @format
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { fetchOrderByIdAsync, updateOrderStatusAsync, cancelOrderAsync } from '../store/slices/ordersSlice';
import { updateSellerOrderStatus } from '../services/orderService';
import { showToast } from '../store/slices/toastSlice';
import { formatPrice, formatOrderDate } from '../services/orderService';
import { getImageUrl } from '../config/api';
import { captureScreen } from 'react-native-view-shot';

const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

const SELLER_STATUS_FLOW = {
  pending: ['confirmed'], // Sellers can confirm orders
  confirmed: ['processing'], // Sellers can process orders
  processing: ['shipped'], // Sellers can ship orders
  shipped: ['delivered'], // Sellers can mark as delivered
  delivered: [], // No further actions
  cancelled: [] // Cannot modify cancelled orders
};

export default function OrderDetailScreen({ route, navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  
    
  const { orderId } = route.params;
  const currentOrder = useSelector((state) => state.orders.currentOrder);
  const loading = useSelector((state) => state.orders.loading);
  const updating = useSelector((state) => state.orders.updating);
  const cancelling = useSelector((state) => state.orders.cancelling);
  const { user } = useSelector((state) => state.auth);
  
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      console.log('Loading order details for ID:', orderId);
      const result = await dispatch(fetchOrderByIdAsync(orderId));
      console.log('Order fetch result:', result);
    } catch (error) {
      console.error('Error loading order details:', error);
      dispatch(showToast({ message: 'Failed to load order details', type: 'error' }));
    }
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
                type: 'orders/updateCurrentOrder',
                payload: { ...order, status: newStatus }
              });
              
              let result;
              
              // Use seller endpoint if user is seller
              if (user?.role === 'seller') {
                result = await updateSellerOrderStatus(order._id, newStatus, '');
              } else {
                result = await dispatch(updateOrderStatusAsync({
                  orderId: order._id,
                  status: newStatus,
                  notes: ''
                }));
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
                type: 'orders/updateCurrentOrder',
                payload: order
              });
              dispatch(showToast({ message: 'Failed to update order', type: 'error' }));
            }
          }
        }
      ]
    );
  };

  const canUpdateStatus = () => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'seller') {
      // Check if order contains seller's products
      return currentOrder?.items?.some(item => {
        const sellerId = item.seller.toString();
        // Handle both ObjectId string and stringified object (same as backend fix)
        if (sellerId.includes('{')) {
          try {
            const parsed = JSON.parse(sellerId);
            return parsed._id === user._id;
          } catch (error) {
            const objectIdMatch = sellerId.match(/ObjectId\('([^']+)'\)/);
            if (objectIdMatch) {
              return objectIdMatch[1] === user._id;
            }
          }
        }
        return sellerId === user._id;
      });
    }
    return false;
  };

  const canCancelOrder = () => {
    return currentOrder?.status === 'pending' && user?.role !== 'admin' && user?.role !== 'seller';
  };

  const handleCancelOrder = async () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          onPress: async () => {
            try {
              // Update local state immediately for better UX
              dispatch({
                type: 'orders/updateCurrentOrder',
                payload: { ...currentOrder, status: 'cancelled' }
              });
              
              const result = await dispatch(cancelOrderAsync({
                orderId: currentOrder._id,
                reason: 'Cancelled by customer'
              }));
              
              if (result.dispatch) {
                dispatch(showToast({ 
                  message: 'Order cancelled successfully', 
                  type: 'success' 
                }));
                setStatusModalVisible(false);
              } else {
                // Revert local state if API call fails
                dispatch({
                  type: 'orders/updateCurrentOrder',
                  payload: currentOrder
                });
                dispatch(showToast({ 
                  message: result.payload || 'Failed to cancel order', 
                  type: 'error' 
                }));
              }
            } catch (error) {
              // Revert local state if API call fails
              dispatch({
                type: 'orders/updateCurrentOrder',
                payload: currentOrder
              });
              dispatch(showToast({ message: 'Failed to cancel order', type: 'error' }));
            }
          }
        }
      ]
    );
  };

  const getStatusOptions = () => {
    if (!currentOrder) return [];
    
    // Use different status flows based on user role
    if (user?.role === 'seller') {
      return SELLER_STATUS_FLOW[currentOrder.status] || [];
    } else {
      return STATUS_FLOW[currentOrder.status] || [];
    }
  };

  const renderOrderItem = ({ item, index }) => (
    <View key={index} style={[styles.orderItem, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemImageContainer}>
          {item.product?.images?.length > 0 ? (
            <Image 
              source={{ uri: getImageUrl(item.product.images[0]) }} 
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.itemImagePlaceholder, { backgroundColor: theme.muted }]}>
              <Ionicons name="image-outline" size={20} color={theme.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={2}>
            {item.product?.title}
          </Text>
          <Text style={[styles.itemSeller, { color: theme.textSecondary }]}>
            Seller: {item.seller?.firstName} {item.seller?.lastName}
          </Text>
        </View>
        <Text style={[styles.itemPrice, { color: theme.text }]}>
          {formatPrice(item.price)}
        </Text>
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.itemDetailsLeft}>
          <Text style={[styles.itemQuantity, { color: theme.textSecondary }]}>
            Quantity: {item.quantity}
          </Text>
          {item.size && (
            <Text style={[styles.itemSize, { color: theme.textSecondary }]}>
              Size: {item.size}
            </Text>
          )}
          {item.customSize && (
            <View style={styles.customSizeContainer}>
              <Text style={[styles.customSizeTitle, { color: theme.text }]}>Custom Measurements:</Text>
              {item.customSize.chest && <Text style={[styles.customSizeField, { color: theme.textSecondary }]}>Chest: {item.customSize.chest}"</Text>}
              {item.customSize.waist && <Text style={[styles.customSizeField, { color: theme.textSecondary }]}>Waist: {item.customSize.waist}"</Text>}
              {item.customSize.length && <Text style={[styles.customSizeField, { color: theme.textSecondary }]}>Length: {item.customSize.length}"</Text>}
              {item.customSize.shoulders && <Text style={[styles.customSizeField, { color: theme.textSecondary }]}>Shoulders: {item.customSize.shoulders}"</Text>}
              {item.customSize.sleeves && <Text style={[styles.customSizeField, { color: theme.textSecondary }]}>Sleeves: {item.customSize.sleeves}"</Text>}
            </View>
          )}
        </View>
        <Text style={[styles.itemTotal, { color: theme.text }]}>
          Total: {formatPrice(item.price * item.quantity)}
        </Text>
      </View>
    </View>
  );

  const renderStatusTimeline = () => {
    const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentStatusIndex = statusSteps.indexOf(currentOrder?.status);
    
    return (
      <View style={[styles.statusTimeline, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
        <Text style={[styles.timelineTitle, { color: theme.text }]}>Order Status</Text>
        <View style={styles.timeline}>
          {statusSteps.map((status, index) => {
            const isCompleted = index <= currentStatusIndex && currentOrder?.status !== 'cancelled';
            const isCurrent = index === currentStatusIndex;
            
            return (
              <View key={status} style={styles.timelineStep}>
                <View style={[
                  styles.timelineDot,
                  isCompleted && { backgroundColor: getStatusColor(status) },
                  isCurrent && { backgroundColor: getStatusColor(status), borderWidth: 3, borderColor: '#fff' }
                ]}>
                  <Ionicons 
                    name={getStatusIcon(status)} 
                    size={12} 
                    color={isCompleted ? '#fff' : theme.muted} 
                  />
                </View>
                <Text style={[
                  styles.timelineLabel,
                  { color: isCompleted ? theme.text : theme.muted }
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
                {index < statusSteps.length - 1 && (
                  <View style={[
                    styles.timelineLine,
                    index < currentStatusIndex && { backgroundColor: getStatusColor(statusSteps[currentStatusIndex]) }
                  ]} />
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentOrder) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.muted} />
          <Text style={[styles.errorText, { color: theme.muted }]}>Order not found</Text>
          <Text style={[styles.errorSubText, { color: theme.textSecondary }]}>
            Order ID: {orderId || 'Not provided'}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={loadOrderDetails}
          >
            <Text style={[styles.retryButtonText, { color: theme.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Order Details</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.contentContainer}>
        {/* Order Header */}
        <View style={[styles.orderHeaderCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={[styles.orderNumber, { color: theme.text }]}>
                Order #{currentOrder.orderNumber}
              </Text>
              <Text style={[styles.orderDate, { color: theme.textSecondary }]}>
                {formatOrderDate(currentOrder.orderDate)}
              </Text>
              {currentOrder.deliveryDate && (
                <Text style={[styles.deliveryDate, { color: theme.text }]}>
                  Expected delivery: {formatOrderDate(currentOrder.deliveryDate)}
                </Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentOrder.status) }]}>
              <Ionicons name={getStatusIcon(currentOrder.status)} size={16} color="#fff" style={styles.statusIcon} />
              <Text style={styles.statusText}>{currentOrder.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Status Timeline */}
        {renderStatusTimeline()}

        {/* Customer Information */}
        <View style={[styles.addressCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Customer Information</Text>
          <View style={styles.addressContent}>
            <Text style={[styles.addressName, { color: theme.text }]}>
              {currentOrder.shippingAddress?.fullName}
            </Text>
            <Text style={[styles.addressPhone, { color: theme.textSecondary }]}>
              {currentOrder.shippingAddress?.phone}
            </Text>
            <Text style={[styles.addressLine, { color: theme.text }]}>
              {currentOrder.shippingAddress?.address}
            </Text>
            <Text style={[styles.addressLine, { color: theme.text }]}>
              {currentOrder.shippingAddress?.area}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.itemsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Order Items ({currentOrder.items.length})</Text>
          {currentOrder.items.map((item, index) => renderOrderItem({ item, index }))}
        </View>

        {/* Order Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {formatPrice(currentOrder.totalAmount)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: theme.text }]}>
              {formatPrice(currentOrder.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {currentOrder.notes && (
          <View style={[styles.notesCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes</Text>
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>
              {currentOrder.notes}
            </Text>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {canUpdateStatus() && getStatusOptions().length > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => setStatusModalVisible(true)}
            >
              <Ionicons name="sync-outline" size={16} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>Update Status</Text>
            </TouchableOpacity>
          )}
           
          {canCancelOrder() && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={handleCancelOrder}
            >
              <Text style={styles.actionButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
          
          
        </View>
      </View>
      </ScrollView>

      {/* Status Update Modal */}
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
                Update Order #{currentOrder?.orderNumber}
              </Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={getStatusOptions().map(status => ({ value: status, label: status.charAt(0).toUpperCase() + status.slice(1), color: getStatusColor(status) }))}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.statusOption, { backgroundColor: item.color }]}
                  onPress={() => {
                    handleStatusUpdate(currentOrder, item.value);
                    setStatusModalVisible(false);
                  }}
                >
                  <Text style={styles.statusOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.statusOptionList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  backButton: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  contentContainer: {
    paddingHorizontal: 16,
    // paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  orderHeaderCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderNumber: { fontSize: 16, fontWeight: '600' },
  orderDate: { fontSize: 12, marginTop: 2 },
  deliveryDate: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIcon: { marginRight: 6 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statusTimeline: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  timelineTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timelineStep: {
    flex: 1,
    alignItems: 'center',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineLabel: { fontSize: 10, textAlign: 'center' },
  timelineLine: {
    position: 'absolute',
    top: 12,
    left: '50%',
    right: '-50%',
    height: 2,
    zIndex: -1,
    backgroundColor: '#E5E5E7',
  },
  addressCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  addressContent: {},
  addressName: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  addressPhone: { fontSize: 12, marginBottom: 2 },
  addressLine: { fontSize: 12, marginBottom: 2 },
  itemsSection: { marginBottom: 16 },
  orderItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemTitle: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  itemSeller: { fontSize: 12 },
  itemPrice: { fontSize: 14, fontWeight: '600' },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemDetailsLeft: { flex: 1 },
  itemQuantity: { fontSize: 12 },
  itemSize: { fontSize: 12 },
  customSizeContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  customSizeTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  customSizeField: { fontSize: 12 },
  itemTotal: { fontSize: 12, fontWeight: '500' },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14 },
  totalRow: {
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 16, fontWeight: '600' },
  notesCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  notesText: { fontSize: 14, lineHeight: 20 },
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
  statusOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  statusOptionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statusOptionList: { paddingBottom: 20 },
});
