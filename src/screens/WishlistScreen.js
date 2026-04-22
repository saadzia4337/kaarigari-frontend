/**
 * Wishlist screen - saved items from Redux (API, per user)
 * @format
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import ProductCard from '../components/ProductCard';
import { selectWishlistItems } from '../store/slices/wishlistSlice';

export default function WishlistScreen({ navigation }) {
  const theme = useTheme();
  const wishlistItems = useSelector(selectWishlistItems);

  const renderItem = ({ item, index }) => (
    <View style={[styles.cardWrap, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}>
      <ProductCard
        product={item}
        onPress={(p) => navigation.navigate('ProductDetail', { product: p })}
        sellerName={item.sellerName}
        sellerType={item.sellerType}
        sellerAvatar={item.sellerAvatar}
        image={item.image}
        title={item.title}
        location={item.location}
        price={item.price}
        quantity={item.quantity}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Wishlist</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{wishlistItems.length} items</Text>
        </View>
      </View>
      {wishlistItems.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="heart-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Your wishlist is empty</Text>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          keyExtractor={(item) => item._id || item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          renderItem={renderItem}
        />
      )}
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
  row: { justifyContent: 'space-between' },
  cardWrap: { marginBottom: 12 },
  cardLeft: { marginRight: 12 },
  cardRight: { marginRight: 0 },
});
