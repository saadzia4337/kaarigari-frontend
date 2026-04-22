/**
 * Place order screen - address, order summary with inc/dec qty (max = product.quantity), place order
 * @format
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { defaultAddress } from '../data/mock';
import { selectCartItems, updateCartQtyAsync } from '../store/slices/cartSlice';
import { createOrderAsync } from '../store/slices/ordersSlice';
import { formatOrderData, calculateOrderTotal } from '../services/orderService';
import { showToast } from '../store/slices/toastSlice';
import { formatPrice } from '../config/currency';

export default function PlaceOrderScreen({ navigation, route }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const creating = useSelector((state) => state.orders.creating);
  const sellerName = route.params?.sellerName;
  const [placingOrder, setPlacingOrder] = useState(false);

  const items = useMemo(() => {
    if (!sellerName) return [];
    return cartItems.filter((it) => (it.product?.sellerName || 'Other') === sellerName);
  }, [cartItems, sellerName]);

  const total = useMemo(
    () => items.reduce((sum, it) => sum + (it.product?.price ?? 0) * (it.qty || 1), 0),
    [items]
  );

  const handlePlaceOrder = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to place an order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    if (items.length === 0) {
      dispatch(showToast({ message: 'No items in order', type: 'error' }));
      return;
    }

    // Validate shipping address
    if (!defaultAddress.fullName || !defaultAddress.phone || !defaultAddress.address || !defaultAddress.city) {
      Alert.alert('Invalid Address', 'Please complete your shipping address before placing an order.');
      return;
    }

    setPlacingOrder(true);

    try {
      // Format order data
      const orderData = formatOrderData(items, defaultAddress, '');
      
      // Create order
      const result = await dispatch(createOrderAsync(orderData));
      
      if (createOrderAsync.fulfilled.match(result)) {
        // Clear cart for these items (only for the specific seller)
        const cartItemIdsToRemove = items.map(item => item.id);
        
        // Show success message
        dispatch(showToast({ 
          message: `Order placed successfully! Order #${result.payload.orderNumber}`, 
          type: 'success' 
        }));
        
        // Navigate to Home page
        navigation.navigate('MainTabs');
      } else {
        // Handle error
        dispatch(showToast({ 
          message: result.payload || 'Failed to place order', 
          type: 'error' 
        }));
      }
    } catch (error) {
      dispatch(showToast({ 
        message: 'Failed to place order. Please try again.', 
        type: 'error' 
      }));
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {sellerName ? `Place Order – ${sellerName}` : 'Place Order'}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Delivery address</Text>
          <View style={[styles.addressCard, { backgroundColor: theme.backgroundSecondary }]}>
            <Ionicons name="location-outline" size={22} color={theme.primary.trim()} />
            <View style={styles.addressText}>
              <Text style={[styles.addressName, { color: theme.text }]}>{defaultAddress.fullName}</Text>
              <Text style={[styles.addressLine, { color: theme.textSecondary }]}>{defaultAddress.phone}</Text>
              <Text style={[styles.addressLine, { color: theme.textSecondary }]}>
                {defaultAddress.address}, {defaultAddress.area}, {defaultAddress.city}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Order summary</Text>
          {items.map((item, idx) => (
            <OrderSummaryRow
              key={`${item.id}-${item.size || ''}-${idx}`}
              item={item}
              theme={theme}
              onUpdateQty={(productId, qty, size) => dispatch(updateCartQtyAsync({ productId, qty, size }))}
            />
          ))}
          <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: theme.text }]}>{formatPrice(total)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.placeBtn, { backgroundColor: theme.primary.trim() }, (placingOrder || creating) && styles.placeBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={placingOrder || creating || items.length === 0}
        >
          {(placingOrder || creating) ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.placeBtnText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function OrderSummaryRow({ item, theme, onUpdateQty }) {
  const { product, qty } = item;
  const maxQty = Math.max(1, Number(product?.quantity) || 999);
  const canDec = qty > 1;
  const canInc = qty < maxQty;
  const lineTotal = (product?.price ?? 0) * (qty || 1);

  const handleDec = () => {
    if (!canDec) return;
    onUpdateQty(item.id, qty - 1, item.size);
  };

  const handleInc = () => {
    if (!canInc) return;
    onUpdateQty(item.id, qty + 1, item.size);
  };

  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryTitle, { color: theme.text }]} numberOfLines={1}>
        {product?.title}
      </Text>
      <View style={[styles.qtyControls, { borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={handleDec}
          style={[styles.qtyBtn, !canDec && styles.qtyBtnDisabled]}
          disabled={!canDec}
        >
          <Ionicons name="remove" size={18} color={canDec ? theme.text : theme.muted} />
        </TouchableOpacity>
        <Text style={[styles.qtyText, { color: theme.text }]}>{qty}</Text>
        <TouchableOpacity
          onPress={handleInc}
          style={[styles.qtyBtn, !canInc && styles.qtyBtnDisabled]}
          disabled={!canInc}
        >
          <Ionicons name="add" size={18} color={canInc ? theme.text : theme.muted} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.summaryPrice, { color: theme.text }]}>{formatPrice(lineTotal)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  addressCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  addressText: {},
  addressName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  addressLine: { fontSize: 14, marginBottom: 2 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 8,
  },
  summaryTitle: { flex: 1, marginRight: 8, fontSize: 15 },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  qtyBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  qtyBtnDisabled: { opacity: 0.5 },
  qtyText: { fontSize: 14, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  summaryPrice: { fontWeight: '600', minWidth: 80, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 18, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '700' },
  placeBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  placeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  placeBtnDisabled: { opacity: 0.6 },
});
