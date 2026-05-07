/**
 * Product detail - image, title, price, seller, description, Add to Cart / Wishlist / Message
 * Supports route.params.product (normalized) or route.params.productId (fetched from API).
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { fetchProductById } from '../store/slices/productsSlice';
import { addToCartAsync, selectCartItems, selectCartCount } from '../store/slices/cartSlice';
import { showToast } from '../store/slices/toastSlice';
import { addToWishlistAsync, removeFromWishlistAsync, selectWishlistItems } from '../store/slices/wishlistSlice';
import { formatPrice } from '../config/currency';
import {
  fetchSizeChartBySellerAndCategory,
  selectSizeChartForProduct,
  clearProductChart,
} from '../store/slices/sizeChartsSlice';
import StarRating from '../components/StarRating';
import ReviewsSection from '../components/ReviewsSection';
import SuggestedProductsSlider from '../components/SuggestedProductsSlider';
import { selectReviewStats } from '../store/slices/reviewsSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMG_SIZE = SCREEN_WIDTH - 32;

export default function ProductDetailScreen({ navigation, route }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const routeProduct = route?.params?.product;
  const productId = route?.params?.productId;
  const currentProduct = useSelector((state) => state.products.currentProduct);
  const product = routeProduct || (productId && currentProduct?._id === productId ? currentProduct : null) || {};
  const primary = (theme.primary && theme.primary.trim && theme.primary.trim()) || theme.primary || '#6366f1';
  const reviewStats = useSelector((state) => selectReviewStats(state, product._id || productId));
  const currentProductId = product._id || productId;

  useEffect(() => {
    if (productId && !routeProduct) {
      dispatch(fetchProductById(productId));
    }
  }, [dispatch, productId, routeProduct]);

  const {
    image,
    images,
    title,
    description,
    price,
    sellerName,
    sellerType,
    sellerAvatar,
    location,
    seller,
    category: productCategory,
    sizes: productSizes = [],
    tryOnOverlay,
  } = product;
  const displayImage = image || (images && images[0]);
  const tryOnOverlayUri = tryOnOverlay || displayImage;
  const imageList = (images && images.length > 0) ? images : (displayImage ? [displayImage] : []);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [customSizeModalVisible, setCustomSizeModalVisible] = useState(false);
  const [customSize, setCustomSize] = useState({ chest: '', waist: '', length: '', shoulders: '', sleeves: '' });
  const sellerId = seller?._id || seller?.id;
  const availableSizes = Array.isArray(productSizes) ? productSizes : [];
  const sizeChart = useSelector((state) => selectSizeChartForProduct(state, sellerId, productCategory));
  const { user } = useSelector((state) => state.auth);
  const isOwnProduct = user && sellerId && user._id === sellerId;
  useEffect(() => {
    if (sellerId && productCategory) {
      dispatch(fetchSizeChartBySellerAndCategory({ sellerId, category: productCategory }));
    }
    return () => {
      dispatch(clearProductChart());
    };
  }, [dispatch, sellerId, productCategory]);

  const sizeChartRows = sizeChart?.rows?.length
    ? sizeChart.rows
    : sizeChart
      ? [{ measurementLabel: sizeChart.measurementLabel, S: sizeChart.S, M: sizeChart.M, L: sizeChart.L }]
      : [];

  const onSliderScroll = (e) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / SCREEN_WIDTH);
    setSliderIndex(Math.min(index, imageList.length - 1));
  };

  const cartItems = useSelector(selectCartItems);
  const pid = product?._id || product?.id;
  const isInCart = pid && cartItems.some(
    (item) => String(item.id) === String(pid) && (availableSizes.length > 0 ? (item.size || '') === (selectedSize || '') : true)
  );

  const handleAddToCart = async () => {
    if (!product || !pid) return;
    if (availableSizes.length > 0 && !selectedSize) {
      Alert.alert('Select size', 'Please select a size.');
      return;
    }
    if (isInCart) {
      dispatch(showToast('Item is already in cart'));
      return;
    }
    // If custom size is selected, pass the customSize object
    const customSizeData = selectedSize?.startsWith('Custom') ? customSize : null;
    try {
      await dispatch(addToCartAsync({ product, qty: 1, size: selectedSize || undefined, customSize: customSizeData })).unwrap();
      navigation.navigate('Cart');
    } catch (e) {
      Alert.alert('Cart', e || 'Please login to add to cart.');
    }
  };

  const cartCount = useSelector(selectCartCount);
  const handleHeaderCartPress = () => {
    navigation.navigate('Cart');
  };

  const wishlistItems = useSelector(selectWishlistItems);
  const isInWishlist = pid && wishlistItems.some((p) => (p._id || p.id) === pid);

  const handleWishlistPress = async () => {
    if (!pid) return;
    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlistAsync(pid)).unwrap();
      } else {
        await dispatch(addToWishlistAsync({ product })).unwrap();
      }
    } catch (e) {
      Alert.alert('Wishlist', e || 'Please login to add to wishlist.');
    }
  };

  const messageSeller = () => {
    const sellerParam = { id: sellerId, name: sellerName, image: sellerAvatar };
    navigation.navigate('Messages', { seller: sellerParam });
  };

  const handleSuggestedProductPress = (suggestedProduct) => {
    navigation.push('ProductDetail', { productId: suggestedProduct._id });
  };

  const openCustomSizeModal = () => {
    setCustomSizeModalVisible(true);
  };

  const closeCustomSizeModal = () => {
    setCustomSizeModalVisible(false);
  };

  const saveCustomSize = () => {
    const { chest, waist, length, shoulders, sleeves } = customSize;
    if (!chest && !waist && !length && !shoulders && !sleeves) {
      Alert.alert('Custom Size', 'Please enter at least one measurement.');
      return;
    }
    // Store the custom size object and also set a display string for selectedSize
    const customSizeString = `Custom: ${chest ? `Chest: ${chest}"` : ''}${waist ? `, Waist: ${waist}"` : ''}${length ? `, Length: ${length}"` : ''}${shoulders ? `, Shoulders: ${shoulders}"` : ''}${sleeves ? `, Sleeves: ${sleeves}"` : ''}`;
    setSelectedSize(customSizeString);
    closeCustomSizeModal();
  };

  const handleCustomSizeChange = (field, value) => {
    setCustomSize(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          Product
        </Text>
        <TouchableOpacity onPress={handleHeaderCartPress} style={styles.headerCartBtn}>
          <Ionicons name="cart-outline" size={24} color={theme.text} />
          {cartCount > 0 ? (
            <View style={[styles.headerCartBadge, { backgroundColor: primary }]}>
              <Text style={styles.headerCartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageWrap}>
          {imageList.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onSliderScroll}
                onScroll={onSliderScroll}
                scrollEventThrottle={16}
                style={styles.imageSlider}
                contentContainerStyle={styles.imageSliderContent}
              >
                {imageList.map((uri, index) => (
                  <View key={index} style={styles.slide}>
                    <Image source={{ uri }} style={styles.image} resizeMode="cover" />
                  </View>
                ))}
              </ScrollView>
              {imageList.length > 1 ? (
                <View style={styles.dotsRow}>
                  {imageList.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        { backgroundColor: index === sliderIndex ? (primary || '#6366f1') : theme.border },
                      ]}
                    />
                  ))}
                </View>
              ) : null}
            </>
          ) : productId && !routeProduct ? (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <ActivityIndicator size="small" color={theme.textSecondary} />
            </View>
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={48} color={theme.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]}>{title || 'Product name'}</Text>
          </View>
          <View style={styles.ratingPriceRow}>
            {reviewStats && reviewStats.reviewCount > 0 && (
              <View style={styles.ratingContainer}>
                <StarRating 
                  rating={reviewStats.averageRating} 
                  size={16} 
                  showValue={true}
                  valueStyle={styles.ratingValue}
                />
                <Text style={[styles.reviewCountText, { color: theme.textSecondary }]}>
                  ({reviewStats.reviewCount})
                </Text>
              </View>
            )}
            <Text style={[styles.price, { color: theme.text }]}>
              {formatPrice(price)}
            </Text>
          </View>

          <View style={[styles.sellerRow, { backgroundColor: theme.backgroundSecondary }]}>
            <Image source={{ uri: sellerAvatar }} style={styles.avatar} />
            <View style={styles.sellerText}>
              <Text style={[styles.sellerName, { color: theme.text }]}>{sellerName || 'Seller'}</Text>
              <Text style={[styles.sellerType, { color: theme.textSecondary }]}>{sellerType || 'Tailor'}</Text>
            </View>
            <TouchableOpacity style={[styles.msgBtn, { backgroundColor: primary }]} onPress={messageSeller}>
              <Ionicons name="chatbubble-outline" size={18} color="#fff" />
              <Text style={styles.msgBtnText}>Message</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={theme.textSecondary} />
            <Text style={[styles.location, { color: theme.textSecondary }]}>{location || '—'}</Text>
          </View>

          <Text style={[styles.descTitle, { color: theme.text }]}>Description</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {description || 'No description provided.'}
          </Text>

          {sizeChart && sizeChartRows.length > 0 ? (
            <View style={[styles.sizeChartSection, { borderColor: theme.border }]}>
              <Text style={[styles.descTitle, { color: theme.text }]}>Size chart (Inches) </Text>
              <View style={[styles.sizeChartTable, { borderColor: theme.border }]}>
                <View style={[styles.sizeChartRow, styles.sizeChartHeader, { borderColor: theme.border }]}>
                  <Text style={[styles.sizeChartCell, styles.sizeChartHeaderText, { color: theme.text }]}>Measurement</Text>
                  {['S', 'M', 'L'].map((s) => (
                    <Text key={s} style={[styles.sizeChartCell, styles.sizeChartHeaderText, { color: theme.text }]}>{s}</Text>
                  ))}
                </View>
                {sizeChartRows.map((row, idx) => (
                  <View key={idx} style={[styles.sizeChartRow, { borderColor: theme.border }]}>
                    <Text style={[styles.sizeChartCell, { color: theme.text }]} numberOfLines={1}>{row.measurementLabel || '—'}</Text>
                    {['S', 'M', 'L'].map((s) => (
                      <Text key={s} style={[styles.sizeChartCell, { color: theme.textSecondary }]}>{row[s] ?? '—'}</Text>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {availableSizes.length > 0 ? (
            <View style={[styles.sizeSection, { borderColor: theme.border }]}>
              <Text style={[styles.descTitle, { color: theme.text }]}>Size</Text>
              <View style={styles.radioRow}>
                {availableSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.radioOption,
                        { borderColor: theme.border, backgroundColor: isSelected ? primary : theme.backgroundSecondary },
                      ]}
                      onPress={() => setSelectedSize(size)}
                    >
                      <View style={[styles.radioOuter, { borderColor: isSelected ? '#fff' : theme.textSecondary }]}>
                        {isSelected ? <View style={styles.radioInner} /> : null}
                      </View>
                      <Text style={[styles.radioLabel, { color: isSelected ? '#fff' : theme.text }]}>{size}</Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    styles.customSizeOption,
                    { borderColor: theme.border, backgroundColor: selectedSize?.startsWith('Custom') ? primary : theme.backgroundSecondary },
                  ]}
                  onPress={openCustomSizeModal}
                >
                  <Ionicons 
                    name="create-outline" 
                    size={16} 
                    color={selectedSize?.startsWith('Custom') ? '#fff' : theme.textSecondary} 
                  />
                  <Text style={[styles.radioLabel, { color: selectedSize?.startsWith('Custom') ? '#fff' : theme.text }]}>Custom</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {Platform.OS === 'android' && tryOnOverlayUri ? (
            <TouchableOpacity
              style={[styles.tryOnBtn, { borderColor: primary }]}
              onPress={() =>
                navigation.navigate('TryOn', {
                  overlayUri: tryOnOverlayUri,
                  productTitle: title || 'Try on',
                })
              }
            >
              <Ionicons name="shirt-outline" size={22} color={primary} />
              <Text style={[styles.tryOnBtnText, { color: primary }]}>Try on (AR)</Text>
            </TouchableOpacity>
          ) : null}
          {!isOwnProduct && (
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: primary }]} onPress={handleAddToCart}>
              <Ionicons name="cart-outline" size={22} color="#fff" />
              <Text style={styles.primaryBtnText}>Add to Cart</Text>
            </TouchableOpacity>
          )}
          {isOwnProduct && (
            <View style={[styles.primaryBtn, { backgroundColor: '#ccc' }]}>
              <Ionicons name="cart-outline" size={22} color="#999" />
              <Text style={[styles.primaryBtnText, { color: '#999' }]}>Your Product</Text>
            </View>
          )}
          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.border }]} onPress={handleWishlistPress}>
            <Ionicons name={isInWishlist ? 'heart' : 'heart-outline'} size={22} color={primary} />
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
              {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </Text>
          </TouchableOpacity>
          
          <SuggestedProductsSlider 
            category={productCategory}
            excludeId={currentProductId}
            onProductPress={handleSuggestedProductPress}
          />
          
          {currentProductId && (
            <ReviewsSection productId={currentProductId} />
          )}
        </View>
      </ScrollView>

      <Modal
        visible={customSizeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeCustomSizeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Custom Size</Text>
              <TouchableOpacity onPress={closeCustomSizeModal}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Enter your measurements (in inches)</Text>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputFieldLabel, { color: theme.text }]}>Chest</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  placeholder="e.g., 40"
                  placeholderTextColor={theme.textSecondary}
                  value={customSize.chest}
                  onChangeText={(value) => handleCustomSizeChange('chest', value)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputFieldLabel, { color: theme.text }]}>Waist</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  placeholder="e.g., 32"
                  placeholderTextColor={theme.textSecondary}
                  value={customSize.waist}
                  onChangeText={(value) => handleCustomSizeChange('waist', value)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputFieldLabel, { color: theme.text }]}>Length</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  placeholder="e.g., 28"
                  placeholderTextColor={theme.textSecondary}
                  value={customSize.length}
                  onChangeText={(value) => handleCustomSizeChange('length', value)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputFieldLabel, { color: theme.text }]}>Shoulders</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  placeholder="e.g., 18"
                  placeholderTextColor={theme.textSecondary}
                  value={customSize.shoulders}
                  onChangeText={(value) => handleCustomSizeChange('shoulders', value)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputFieldLabel, { color: theme.text }]}>Sleeves</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  placeholder="e.g., 24"
                  placeholderTextColor={theme.textSecondary}
                  value={customSize.sleeves}
                  onChangeText={(value) => handleCustomSizeChange('sleeves', value)}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: theme.border }]}
                onPress={closeCustomSizeModal}
              >
                <Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: primary }]}
                onPress={saveCustomSize}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', flex: 1 },
  headerCartBtn: { padding: 4, marginLeft: 8, position: 'relative', minWidth: 40, alignItems: 'center', justifyContent: 'center' },
  headerCartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerCartBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  scrollContent: { paddingBottom: 24 },
  imageWrap: { padding: 16, paddingBottom: 8 },
  imageSlider: { width: IMG_SIZE, borderRadius: 12, overflow: 'hidden' },
  imageSliderContent: { flexGrow: 0 },
  slide: { width: IMG_SIZE, height: IMG_SIZE },
  image: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 16 },
  titleRow: { marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '700' },
  ratingPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCountText: {
    fontSize: 12,
    marginLeft: 4,
  },
  price: { fontSize: 22, fontWeight: '700' },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  sellerText: { flex: 1, minWidth: 0 },
  sellerName: { fontSize: 16, fontWeight: '600' },
  sellerType: { fontSize: 13 },
  msgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  msgBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 6 },
  location: { fontSize: 14 },
  descTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    gap: 10,
    marginBottom: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tryOnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    gap: 10,
    marginBottom: 12,
  },
  tryOnBtnText: { fontSize: 16, fontWeight: '600' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    gap: 10,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '600' },
  sizeChartSection: { marginBottom: 24, paddingTop: 16, borderTopWidth: 1 },
  sizeChartTable: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  sizeChartRow: { flexDirection: 'row', borderBottomWidth: 1 },
  sizeChartHeader: { backgroundColor: 'rgba(0,0,0,0.05)' },
  sizeChartHeaderText: { fontWeight: '700' },
  sizeChartCell: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, fontSize: 14 },
  sizeSection: { marginBottom: 24, paddingTop: 16, borderTopWidth: 1 },
  radioRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  customSizeOption: {
    gap: 6,
  },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  radioLabel: { fontSize: 16, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalScroll: { maxHeight: 300, marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  inputFieldLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 16, fontWeight: '600' },
  modalSaveButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
