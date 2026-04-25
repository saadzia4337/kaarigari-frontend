/**
 * Product card - seller row, image, heart, title, location, price, cart
 * @format
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { addToWishlistAsync, removeFromWishlistAsync, selectWishlistItems } from '../store/slices/wishlistSlice';
import { formatPrice } from '../config/currency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2;
const IMG_SIZE = CARD_WIDTH - 24;

export default function ProductCard({
  sellerName,
  sellerType,
  sellerAvatar,
  image,
  title,
  location,
  price,
  product,
  quantity,
  onPress,
}) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const wishlistItems = useSelector(selectWishlistItems);
  const productId = product?._id || product?.id;
  const isInWishlist = productId && wishlistItems.some((p) => (p._id || p.id) === productId);
  const isSoldOut = quantity === 0;

  const handleWishlistPress = (e) => {
    e?.stopPropagation?.();
    if (!productId) return;
    if (isInWishlist) {
      dispatch(removeFromWishlistAsync(productId));
    } else {
      dispatch(addToWishlistAsync({ product }));
    }
  };

  const cardContent = (
    <>
      <View style={styles.sellerRow}>
        <Image source={{ uri: sellerAvatar }} style={styles.avatar} />
        <View style={styles.sellerText}>
          <Text style={[styles.sellerName, { color: theme.text }]} numberOfLines={1}>
            {sellerName}
          </Text>
          <Text style={[styles.sellerType, { color: theme.textSecondary }]}>
            {sellerType}
          </Text>
        </View>
      </View>
      <View style={styles.imgWrap}>
        <Image source={{ uri: image }} style={styles.productImage} />
        <TouchableOpacity style={styles.heartWrap} onPress={handleWishlistPress}>
          <Ionicons name={isInWishlist ? 'heart' : 'heart-outline'} size={20} color="#c62828" />
        </TouchableOpacity>
        {isSoldOut && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>SOLD</Text>
          </View>
        )}
      </View>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
        {title}
      </Text>
      <Text style={[styles.location, { color: theme.textSecondary }]} numberOfLines={1}>
        {location}
      </Text>
      <View style={styles.footer}>
        <Text style={[styles.price, { color: theme.text }]}>{formatPrice(price)}</Text>
        <TouchableOpacity 
          onPress={(e) => { e?.stopPropagation?.(); }}
          disabled={isSoldOut}
          style={isSoldOut && styles.cartButtonDisabled}
        >
          <Ionicons 
            name="cart-outline" 
            size={22} 
            color={isSoldOut ? '#ccc' : theme.primary} 
          />
        </TouchableOpacity>
      </View>
    </>
  );

  if (onPress && product) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPress(product)}
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.text }]}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.text }]}>
      {cardContent}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    // shadowOpacity: 0.06,
    // shadowRadius: 4,
    // elevation: 2,
  },
  sellerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 24, height: 24, borderRadius: 12, marginRight: 6 },
  sellerText: { flex: 1, minWidth: 0 },
  sellerName: { fontSize: 12, fontWeight: '600' },
  sellerType: { fontSize: 10 },
  imgWrap: { position: 'relative', marginBottom: 8 },
  productImage: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  heartWrap: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 4,
  },
  soldBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  soldBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  title: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  location: { fontSize: 11, marginBottom: 6 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: { fontSize: 14, fontWeight: '700' },
  cartButtonDisabled: {
    opacity: 0.5,
  },
});
