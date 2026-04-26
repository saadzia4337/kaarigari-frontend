/**
 * Home screen - header + banner, categories, secondary banner, tailors, products
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { getHello } from '../services/authService';
import { imageUrl } from '../services/productService';
import { fetchProducts } from '../store/slices/productsSlice';
import { fetchPrimaryBanner, fetchSecondaryBanner } from '../store/slices/bannersSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import {
  selectPrimarySlides,
  selectSecondaryBanner,
} from '../store/slices/bannersSlice';
import { selectCategories } from '../store/slices/categoriesSlice';
import Header from '../components/Header';
import PrimaryBanner from '../components/PrimaryBanner';
import CategoryCard from '../components/CategoryCard';
import SecondaryBanner from '../components/SecondaryBanner';
import TailorCard from '../components/TailorCard';
import ProductCard from '../components/ProductCard';
import SkeletonCategory from '../components/SkeletonCategory';
import SkeletonTailor from '../components/SkeletonTailor';
import SkeletonCard from '../components/SkeletonCard';
import { getBestSellers, getSellerImageUri } from '../services/sellersService';

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const primarySlides = useSelector(selectPrimarySlides);
  const secondaryBanner = useSelector(selectSecondaryBanner);
  const categories = useSelector(selectCategories);
  const [helloMessage, setHelloMessage] = useState(null);
  const [helloLoading, setHelloLoading] = useState(true);
  const [helloError, setHelloError] = useState(null);
  const [bestSellers, setBestSellers] = useState([]);
  const [bestSellersLoading, setBestSellersLoading] = useState(true);
  const [bestSellerProducts, setBestSellerProducts] = useState([]);
  const [bestSellerProductsLoading, setBestSellerProductsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchPrimaryBanner());
    dispatch(fetchSecondaryBanner());
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    setBestSellerProductsLoading(true);
    // Fetch products from best sellers only
    dispatch(fetchProducts({ bestSeller: true }))
      .unwrap()
      .then((data) => {
        if (!cancelled) setBestSellerProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setBestSellerProducts([]);
      })
      .finally(() => {
        if (!cancelled) setBestSellerProductsLoading(false);
      });
    return () => { cancelled = true; };
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    getHello()
      .then((data) => {
        if (!cancelled) setHelloMessage(data.message);
      })
      .catch((err) => {
        if (!cancelled) setHelloError(err.message || 'Could not reach API. Same WiFi? Check src/config/api.js');
      })
      .finally(() => {
        if (!cancelled) setHelloLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setBestSellersLoading(true);
    getBestSellers()
      .then((data) => {
        if (!cancelled) setBestSellers(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setBestSellers([]);
      })
      .finally(() => {
        if (!cancelled) setBestSellersLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleCategoryPress = (categoryId) => {
    navigation.navigate('Products', { selectedCategory: categoryId });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Refresh all data
      await Promise.all([
        dispatch(fetchPrimaryBanner()).unwrap(),
        dispatch(fetchSecondaryBanner()).unwrap(),
        dispatch(fetchCategories()).unwrap(),
        dispatch(fetchProducts({ bestSeller: true })).unwrap(),
      ]);
      
      // Refresh best sellers
      const sellersData = await getBestSellers();
      setBestSellers(Array.isArray(sellersData) ? sellersData : []);
      
      // Refresh hello message
      const helloData = await getHello();
      setHelloMessage(helloData.message);
      setHelloError(null);
      
    } catch (error) {
      console.log('Refresh error:', error);
      if (error.message) {
        setHelloError(error.message);
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header navigation={navigation} />
      {/* <View style={[styles.helloBar, { backgroundColor: theme.backgroundSecondary, borderBottomColor: theme.border }]}>
        {helloLoading && <ActivityIndicator size="small" color={theme.primary?.trim() || '#6366f1'} />}
        {helloError && <Text style={[styles.helloText, { color: '#c62828' }]}>{helloError}</Text>}
        {!helloLoading && !helloError && helloMessage && (
          <Text style={[styles.helloText, { color: theme.primary?.trim() || theme.text }]}>{helloMessage}</Text>
        )}
      </View> */}
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
        <PrimaryBanner slides={primarySlides} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Categories
          </Text>
          <FlatList
            data={categories.length > 0 ? categories : Array(6).fill({})}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => item._id || item.id || `skeleton-${index}`}
            renderItem={({ item, index }) => {
              if (item._id || item.id) {
                return (
                  <CategoryCard 
                    name={item.title || item.name} 
                    image={imageUrl(item.image) || item.image}
                    categoryId={item._id}
                    onPress={handleCategoryPress}
                  />
                );
              }
              return <SkeletonCategory />;
            }}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        <SecondaryBanner banner={secondaryBanner} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Best Sellers
          </Text>
          <FlatList
            data={bestSellers.length > 0 ? bestSellers : Array(6).fill({})}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => item._id || `skeleton-${index}`}
            renderItem={({ item, index }) => {
              if (item._id) {
                const name = item.shopName || [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Seller';
                const sellerPayload = {
                  id: item._id,
                  name,
                  image: getSellerImageUri(item.profilePic),
                };
                return (
                  <TailorCard
                    name={name}
                    image={getSellerImageUri(item.profilePic)}
                    seller={sellerPayload}
                    onPress={() => navigation.navigate('SellerProfile', { seller: sellerPayload, sellerId: item._id })}
                  />
                );
              }
              return <SkeletonTailor />;
            }}
            contentContainerStyle={styles.tailorsList}
            ListEmptyComponent={
              !bestSellersLoading ? (
                <Text style={[styles.emptySellers, { color: theme.textSecondary }]}>No best sellers yet</Text>
              ) : null
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Best Seller Products
          </Text>
            <View style={styles.productsGrid}>
              {(bestSellerProducts.length > 0 ? bestSellerProducts : Array(6).fill({})).map((item, index) => {
                if (item._id || item.id) {
                  return (
                    <View
                      key={item._id || item.id}
                      style={[
                        styles.productCardWrap,
                        index % 2 === 0 ? styles.productCardLeft : styles.productCardRight,
                      ]}
                    >
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
                }
                return (
                  <View
                    key={`skeleton-${index}`}
                    style={[
                      styles.productCardWrap,
                      index % 2 === 0 ? styles.productCardLeft : styles.productCardRight,
                    ]}
                  >
                    <SkeletonCard />
                  </View>
                );
              })}
            </View>
          {!bestSellerProductsLoading && bestSellerProducts.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No best seller products yet</Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  helloBar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  helloText: { fontSize: 14, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  section: { marginTop: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
    marginBottom: 10,
  },
  categoriesList: { paddingHorizontal: 8, paddingBottom: 8 },
  tailorsList: { paddingHorizontal: 8, paddingBottom: 16 },
  tailorsLoading: { paddingVertical: 24, paddingLeft: 16 },
  emptySellers: { paddingVertical: 16, paddingHorizontal: 16, fontSize: 14 },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  productsLoading: { paddingVertical: 24, alignItems: 'center' },
  productsError: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
  emptyText: { paddingHorizontal: 16, paddingVertical: 16, fontSize: 14 },
  productCardWrap: { marginBottom: 12 },
  productCardLeft: { marginRight: 12 },
  productCardRight: { marginRight: 0 },
});
