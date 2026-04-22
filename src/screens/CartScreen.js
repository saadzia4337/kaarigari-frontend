/**
 * Cart screen - grouped by seller; each seller: cards, summary, Secure Checkout → Place Order
 * Uses Redux cart (add/remove/update persisted).
 * @format
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import CartCard from '../components/CartCard';
import { selectCartItems, removeFromCartAsync } from '../store/slices/cartSlice';
import { formatPrice } from '../config/currency';

function sellerSubtotal(items) {
  return items.reduce((sum, it) => sum + (it.product?.price ?? 0) * (it.qty || 1), 0);
}

export default function CartScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);

  const bySeller = useMemo(() => {
    const map = {};
    cartItems.forEach((it) => {
      const name = it.product?.sellerName || 'Other';
      if (!map[name]) map[name] = [];
      map[name].push({
        ...it,
        price: formatPrice((it.product?.price ?? 0) * (it.qty || 1)),
      });
    });
    return Object.entries(map);
  }, [cartItems]);

  const totalItems = cartItems.reduce((sum, it) => sum + (it.qty || 1), 0);
  const primary = (theme.primary && theme.primary.trim && theme.primary.trim()) || '#6366f1';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Cart</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{totalItems} items</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="cart-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Your cart is empty</Text>
          </View>
        ) : (
          <>
          {bySeller.map(([sellerName, items]) => {
          const itemCount = items.reduce((s, it) => s + (it.qty || 1), 0);
          const subtotal = sellerSubtotal(items);
          return (
            <View key={sellerName} style={[styles.sellerBlock, { borderColor: theme.border }]}>
              <Text style={[styles.sellerName, { color: theme.text }]}>{sellerName}</Text>
              {items.map((item, idx) => (
                <CartCard
                  key={`${item.id}-${item.size || ''}-${idx}`}
                  item={item}
                  onRemove={(it) => dispatch(removeFromCartAsync({ productId: it.id, size: it.size }))}
                />
              ))}
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.text }]}>{itemCount} item</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>PKR {subtotal.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Examination Fee</Text>
                  <Text style={[styles.summaryMuted, { color: theme.muted }]}>Included</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Branded Packaging</Text>
                  <Text style={[styles.summaryMuted, { color: theme.muted }]}>Included</Text>
                </View>
                <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
                  <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
                  <Text style={[styles.totalValue, { color: theme.text }]}>PKR {subtotal.toLocaleString()}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.checkoutBtn, { backgroundColor: primary }]}
                  onPress={() => navigation.navigate('PlaceOrder', { sellerName, sellerItems: items })}
                >
                  <Text style={[styles.checkoutBtnText, { color: '#fff' }]}>Secure Checkout</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
          })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  list: { padding: 16, paddingBottom: 24 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, marginTop: 12 },
  sellerBlock: { marginBottom: 24, borderWidth: 1, borderRadius: 8, padding: 12 },
  sellerName: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  summary: { marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  summaryLabel: { fontSize: 15 },
  summaryValue: { fontSize: 15, fontWeight: '600' },
  summaryMuted: { fontSize: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 4, borderTopWidth: 1 },
  totalLabel: { fontSize: 18, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '700' },
  checkoutBtn: { height: 52, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  checkoutBtnText: { fontSize: 16, fontWeight: '600' },
});
