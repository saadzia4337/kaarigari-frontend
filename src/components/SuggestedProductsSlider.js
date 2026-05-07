import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { fetchSuggestedProducts } from '../store/slices/productsSlice';
import { selectSuggestedProducts, selectSuggestedProductsLoading } from '../store/slices/productsSlice';
import { formatPrice } from '../config/currency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PRODUCT_WIDTH = 140;
const PRODUCT_MARGIN = 12;

export default function SuggestedProductsSlider({ category, excludeId, onProductPress }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const suggestedProducts = useSelector(selectSuggestedProducts);
  const loading = useSelector(selectSuggestedProductsLoading);

  useEffect(() => {
    if (category) {
      dispatch(fetchSuggestedProducts({ category, excludeId, limit: 10 }));
    }
  }, [dispatch, category, excludeId]);

  if (!category || (!loading && suggestedProducts.length === 0)) {
    return null;
  }

  const handleProductPress = (product) => {
    if (onProductPress) {
      onProductPress(product);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Suggested Products</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {suggestedProducts.map((product) => (
            <TouchableOpacity
              key={product._id}
              style={[styles.productCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
              onPress={() => handleProductPress(product)}
            >
              <Image source={{ uri: product.image }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={[styles.productTitle, { color: theme.text }]} numberOfLines={2}>
                  {product.title}
                </Text>
                <Text style={[styles.productPrice, { color: theme.primary }]}>
                  {formatPrice(product.price)}
                </Text>
                <Text style={[styles.sellerName, { color: theme.textSecondary }]} numberOfLines={1}>
                  {product.sellerName}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: PRODUCT_MARGIN,
  },
  productCard: {
    width: PRODUCT_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  productImage: {
    width: PRODUCT_WIDTH,
    height: PRODUCT_WIDTH,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 12,
  },
});
