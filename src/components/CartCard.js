/**
 * Cart card - image, title, qty (read-only), price, remove icon. No inc/dec (done on Place Order).
 * @format
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';

export default function CartCard({ item, onRemove }) {
  const theme = useTheme();
  const { product, qty, price, size } = item;

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Image source={{ uri: product?.image }} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {product?.title}
          </Text>
          <TouchableOpacity onPress={() => onRemove?.(item)} style={styles.removeIcon}>
            <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        {size ? <Text style={[styles.sizeText, { color: theme.textSecondary }]}>Size: {size}</Text> : null}
        <View style={styles.qtyRow}>
          <Text style={[styles.qty, { color: theme.textSecondary }]}>Qty: {qty}</Text>
        </View>
        <Text style={[styles.price, { color: theme.text }]}>Rs {price != null ? price : product?.price ?? '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 4,
    marginRight: 14,
  },
  content: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 },
  removeIcon: { padding: 4 },
  sizeText: { fontSize: 13, marginTop: 2 },
  qtyRow: { marginTop: 4 },
  qty: { fontSize: 13 },
  price: { fontSize: 15, fontWeight: '600', marginTop: 6 },
});
