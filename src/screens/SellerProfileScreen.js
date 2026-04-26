/**
 * Seller profile - profile image, item count, Message button, seller products from API
 * @format
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { fetchProducts } from '../store/slices/productsSlice';
import ProductCard from '../components/ProductCard';

const DEFAULT_SELLER = { id: '1', name: 'Rashid Tailors', image: 'https://picsum.photos/seed/t1/120/120' };

export default function SellerProfileScreen({ navigation, route }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const seller = route?.params?.seller || DEFAULT_SELLER;
  const sellerId = route?.params?.sellerId || seller?.id;
  const { user } = useSelector((state) => state.auth);
  const { list: sellerProducts, loading } = useSelector((state) => state.products);
  const [refreshing, setRefreshing] = useState(false);
  const safeSeller = {
    id: seller.id,
    name: seller.name || 'Seller',
    image: typeof seller.image === 'string' && seller.image ? seller.image : DEFAULT_SELLER.image,
  };

  useFocusEffect(
    React.useCallback(() => {
      if (sellerId) {
        dispatch(fetchProducts({ sellerId }));
      }
    }, [dispatch, sellerId])
  );

  const openMessage = () => navigation.navigate('SellerMessage', { seller: safeSeller });

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchProducts({ sellerId })).unwrap();
    } catch (error) {
      console.log('Refresh seller products error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#fff' }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.primary?.trim?.() || theme.primary, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Seller</Text>
      </View>
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <View style={styles.profileSection}>
          <Image source={{ uri: safeSeller.image }} style={styles.avatar} />
          <Text style={[styles.sellerName, { color: theme.text }]}>{safeSeller.name}</Text>
          <Text style={[styles.itemCount, { color: theme.textSecondary }]}>{sellerProducts.length} items</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.messageBtn, { backgroundColor: (theme.primary && theme.primary.trim && theme.primary.trim()) || '#6366f1' }]} onPress={openMessage}>
              <Ionicons name="chatbubble-outline" size={22} color="#fff" />
              <Text style={styles.messageBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.productsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Seller products</Text>
          {loading && sellerProducts.length === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={(theme.primary && theme.primary.trim && theme.primary.trim()) || '#6366f1'} />
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {sellerProducts.map((item, index) => (
                <View key={item._id || item.id} style={[styles.cardWrap, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}>
                  <ProductCard
                    product={item}
                    onPress={handleProductPress}
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
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  profileSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  sellerName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  itemCount: { fontSize: 14, marginBottom: 16 },
  actionButtons: { flexDirection: 'row', gap: 12 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  messageBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  messageBtnText: { color: '#fff', marginLeft: 8, fontSize: 15, fontWeight: '600' },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  editBtnText: { color: '#fff', marginLeft: 8, fontSize: 15, fontWeight: '600' },
  purchasesBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  purchasesBtnText: { color: '#fff', marginLeft: 8, fontSize: 15, fontWeight: '600' },
  ordersBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  ordersBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  productsSection: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  loadingWrap: { paddingVertical: 24, alignItems: 'center' },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cardWrap: { marginBottom: 12 },
  cardLeft: { marginRight: 12 },
  cardRight: { marginRight: 0 },
});
