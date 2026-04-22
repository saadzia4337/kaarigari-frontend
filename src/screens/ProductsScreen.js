/**
 * ProductsScreen - Display all products
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { selectAllProducts, fetchProducts } from '../store/slices/productsSlice';
import { selectCategories, fetchCategories } from '../store/slices/categoriesSlice';
import { formatPrice } from '../config/currency';
import ProductCard from '../components/ProductCard';

const ProductsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const categories = useSelector(selectCategories);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(route.params?.selectedCategory || null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    
    // Fetch all products (not just best sellers)
    console.log('ProductsScreen: Fetching all products...');
    dispatch(fetchProducts())
      .unwrap()
      .then(() => {
        console.log('ProductsScreen: Products fetched successfully');
      })
      .catch((error) => {
        console.error('ProductsScreen: Failed to fetch products:', error);
      })
      .finally(() => {
        setLoading(false);
      });
    
    // Fetch categories if not already loaded
    if (!categories || categories.length === 0) {
      console.log('ProductsScreen: Fetching categories...');
      dispatch(fetchCategories());
    }
    
    // Debug: Log categories data
    console.log('ProductsScreen: Categories data:', categories);
    console.log('ProductsScreen: Categories length:', categories?.length);
    console.log('ProductsScreen: First category structure:', categories?.[0]);
  }, [categories, dispatch]);

  // Handle route parameter changes
  useEffect(() => {
    if (route.params?.selectedCategory !== undefined) {
      setSelectedCategory(route.params.selectedCategory);
    }
  }, [route.params?.selectedCategory]);

  // Debug: Log products data
  useEffect(() => {
    console.log('ProductsScreen: Products data:', products);
    console.log('ProductsScreen: Products length:', products?.length);
    console.log('ProductsScreen: First product structure:', products?.[0]);
  }, [products]);

  // Filter products by selected category and search query
  const filteredProducts = products.filter(product => {
    // Category filtering
    const categoryMatch = selectedCategory
      ? (() => {
          // Handle category as string (from backend) or object (if populated)
          const productCategoryValue = typeof product.category === 'string' 
            ? product.category 
            : product.category?._id;
          
          // Try to match by ID first, then by title (for backward compatibility)
          const selectedCategoryObj = categories.find(cat => cat._id === selectedCategory);
          const selectedCategoryTitle = selectedCategoryObj?.title || selectedCategoryObj?.name;
          
          const matchesById = productCategoryValue === selectedCategory;
          const matchesByTitle = productCategoryValue === selectedCategoryTitle;
          
          return matchesById || matchesByTitle;
        })()
      : true;
    
    // Search filtering
    const searchMatch = searchQuery.trim() === '' || 
      product.title?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      product.category?.title?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      product.category?.name?.toLowerCase().includes(searchQuery.toLowerCase().trim());
    
    return categoryMatch && searchMatch;
  });

  const handleCategoryPress = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Refresh all products and categories
    Promise.all([
      dispatch(fetchProducts()).unwrap(),
      dispatch(fetchCategories()).unwrap()
    ])
      .then(() => {
        console.log('ProductsScreen: Data refreshed successfully');
      })
      .catch((error) => {
        console.error('ProductsScreen: Failed to refresh data:', error);
      })
      .finally(() => {
        setRefreshing(false);
      });
  };

  const renderCategory = ({ item }) => {
    // Debug: Log category item structure
    console.log('ProductsScreen: Rendering category item:', item);
    console.log('ProductsScreen: Category name:', item?.name);
    console.log('ProductsScreen: Category ID:', item?._id);
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          {
            backgroundColor: selectedCategory === item._id ? theme.primary : theme.card,
            borderColor: theme.border,
          }
        ]}
        onPress={() => handleCategoryPress(item._id)}
      >
        <Text
          style={[
            styles.categoryText,
            {
              color: selectedCategory === item._id ? '#fff' : theme.text,
            }
          ]}
        >
          {item?.title || item?.name || 'Unknown'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProduct = ({ item }) => {
    // Debug: Log product item structure
    console.log('ProductsScreen: Rendering product item:', item);
    console.log('ProductsScreen: Product name:', item?.name);
    console.log('ProductsScreen: Product price:', item?.price);
    console.log('ProductsScreen: Product images:', item?.images);
    console.log('ProductsScreen: Product category:', item?.category);
    
    return (
      <ProductCard
        product={item}
        onPress={(product) => navigation.navigate('ProductDetail', { productId: product._id })}
        sellerName={item.sellerName}
        sellerType={item.sellerType}
        sellerAvatar={item.sellerAvatar}
        image={item.image}
        title={item.title}
        location={item.location}
        price={item.price}
        quantity={item.quantity}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
        {selectedCategory ? 'No products in this category' : 'No products available'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>All Products</Text>
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search products..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Categories FlatList */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          ListHeaderComponent={
            <TouchableOpacity
              style={[
                styles.categoryItem,
                {
                  backgroundColor: !selectedCategory ? theme.primary : theme.card,
                  borderColor: theme.border,
                }
              ]}
              onPress={() => handleCategoryPress(null)}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: !selectedCategory ? '#fff' : theme.text,
                  }
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
          }
        />
      </View>
      
      <ScrollView
        contentContainerStyle={styles.productList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredProducts.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.map((item, index) => (
              <View
                key={item._id}
                style={[
                  styles.productCardWrap,
                  index % 2 === 0 ? styles.productCardLeft : styles.productCardRight,
                ]}
              >
                {renderProduct({ item })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoriesList: {
    paddingHorizontal: 12,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  productList: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  productCardWrap: { marginBottom: 12 },
  productCardLeft: { marginRight: 12 },
  productCardRight: { marginRight: 0 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default ProductsScreen;
