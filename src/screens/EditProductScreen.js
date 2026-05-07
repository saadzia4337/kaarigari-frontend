/**
 * Edit Product Screen - Seller can edit their existing products
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { selectAllProducts, updateProductAsync, deleteProductAsync } from '../store/slices/productsSlice';
import { selectCategories, fetchCategories } from '../store/slices/categoriesSlice';
import { showToast } from '../store/slices/toastSlice';
import { launchImageLibrary } from 'react-native-image-picker';
import { formatPrice } from '../config/currency';

const EditProductScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const allProducts = useSelector(selectAllProducts);
  const categories = useSelector(selectCategories);
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [tryOnOverlayNew, setTryOnOverlayNew] = useState(null);
  const [tryOnOverlayRemoved, setTryOnOverlayRemoved] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    images: [],
    quantity: '',
  });

  // Get seller's products only
  const sellerProducts = allProducts.filter(product => {
    // Check if product.seller is an object or string
    if (typeof product.seller === 'object' && product.seller._id) {
      return product.seller._id === user?._id;
    } else if (typeof product.seller === 'string') {
      return product.seller === user?._id;
    }
    return false;
  });

  useEffect(() => {
    // Fetch categories if not loaded
    if (!categories || categories.length === 0) {
      console.log('EditProductScreen: Fetching categories...');
      dispatch(fetchCategories());
    } else {
      console.log('EditProductScreen: Categories already loaded:', categories);
      console.log('EditProductScreen: Categories length:', categories?.length);
    }
  }, [categories, dispatch]);

  const handleEditProduct = (product) => {
    console.log('EditProductScreen: Product category data:', product.category);
    console.log('EditProductScreen: Product category type:', typeof product.category);
    
    setSelectedProduct(product);
    setTryOnOverlayNew(null);
    setTryOnOverlayRemoved(false);
    setEditForm({
      name: product.title || product.name || '',
      price: product.price?.toString() || '',
      description: product.description || '',
      category: product.category?._id || product.category || '',
      images: product.images || [product.image] || [],
      quantity: product.quantity?.toString() || product.stock?.toString() || '',
    });
    setShowEditForm(true);
  };

  const pickTryOnOverlay = () => {
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: false, selectionLimit: 1 },
      (res) => {
        if (res.didCancel || !res.assets?.length) return;
        const a = res.assets[0];
        setTryOnOverlayNew({
          uri: a.uri,
          name: a.fileName || `tryon_${Date.now()}.png`,
          type: a.type || 'image/png',
        });
        setTryOnOverlayRemoved(false);
      }
    );
  };

  const clearTryOnOverlay = () => {
    if (tryOnOverlayNew) {
      setTryOnOverlayNew(null);
      return;
    }
    if (selectedProduct?.tryOnOverlay) {
      setTryOnOverlayRemoved(true);
    }
  };

  const handleImagePick = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const newImages = [...editForm.images];
        response.assets.forEach((asset) => {
          newImages.push(asset.uri);
        });
        setEditForm({ ...editForm, images: newImages });
      }
    });
  };

  const removeImage = (index) => {
    const newImages = editForm.images.filter((_, i) => i !== index);
    setEditForm({ ...editForm, images: newImages });
  };

  const handleCategorySelect = (category) => {
    setEditForm({ ...editForm, category: category._id });
    setShowCategoryDropdown(false);
  };

  const handleDeleteProduct = (product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.title || product.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteProductAsync(product._id)).unwrap();
              dispatch(showToast('Product deleted successfully!'));
            } catch (error) {
              console.log('Delete product error:', error);
              Alert.alert('Error', `Failed to delete product: ${error.message || 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  const handleUpdateProduct = async () => {
    if (!editForm.name.trim() || !editForm.price || !editForm.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    console.log('EditProductScreen: Starting product update...');
    console.log('EditProductScreen: Selected product:', selectedProduct);
    console.log('EditProductScreen: Form data:', editForm);

    setUpdating(true);
    try {
      const productData = {
        name: editForm.name.trim(),
        title: editForm.name.trim(),
        price: parseFloat(editForm.price),
        description: editForm.description.trim(),
        category: editForm.category,
        images: editForm.images,
        quantity: parseInt(editForm.quantity, 10) || 0,
      };

      let payload = productData;
      if (tryOnOverlayNew) {
        const fd = new FormData();
        fd.append('name', productData.name);
        fd.append('title', productData.title);
        fd.append('description', productData.description);
        fd.append('category', String(productData.category || ''));
        fd.append('quantity', String(productData.quantity));
        fd.append('price', String(productData.price));
        fd.append('tryOnOverlay', {
          uri: tryOnOverlayNew.uri,
          name: tryOnOverlayNew.name || 'tryon.png',
          type: tryOnOverlayNew.type || 'image/png',
        });
        payload = fd;
      } else if (tryOnOverlayRemoved && selectedProduct.tryOnOverlay) {
        payload = { ...productData, removeTryOnOverlay: 'true' };
      }

      console.log('EditProductScreen: Product data to send:', tryOnOverlayNew ? '[FormData]' : payload);

      const result = await dispatch(updateProductAsync({
        productId: selectedProduct._id,
        productData: payload,
      })).unwrap();
      
      console.log('EditProductScreen: Update result:', result);
      
      dispatch(showToast('Product updated successfully!'));
      setShowEditForm(false);
      setSelectedProduct(null);
      
      // Reset form
      setTryOnOverlayNew(null);
      setTryOnOverlayRemoved(false);
      setEditForm({
        name: '',
        price: '',
        description: '',
        category: '',
        images: [],
        quantity: '',
      });
    } catch (error) {
      console.log('EditProductScreen: Update error:', error);
      console.log('EditProductScreen: Error message:', error.message);
      Alert.alert('Error', `Failed to update product: ${error.message || 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };

  const renderProductItem = (product) => (
    <View style={[styles.productItem, { backgroundColor: theme.card }]}>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: theme.text }]}>
          {product.title || product.name}
        </Text>
        <Text style={[styles.productPrice, { color: theme.primary }]}>
          {formatPrice(product.price)}
        </Text>
        <Text style={[styles.productCategory, { color: theme.textSecondary }]}>
          {product.category?.title || product.category?.name || 'Uncategorized'}
        </Text>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.primary }]}
          onPress={() => handleEditProduct(product)}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: '#ff4444' }]}
          onPress={() => handleDeleteProduct(product)}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEditForm = () => (
    <View style={[styles.editFormContainer, { backgroundColor: theme.card }]}>
      <View style={styles.formHeader}>
        <Text style={[styles.formTitle, { color: theme.text }]}>
          Edit Product
        </Text>
        <TouchableOpacity onPress={() => setShowEditForm(false)}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContent}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Product Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            value={editForm.name}
            onChangeText={(text) => setEditForm({ ...editForm, name: text })}
            placeholder="Enter product name"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Price (PKR) *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            value={editForm.price}
            onChangeText={(text) => setEditForm({ ...editForm, price: text })}
            placeholder="Enter price"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Category *</Text>
          <TouchableOpacity
            style={[styles.categorySelector, { backgroundColor: theme.background }]}
            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
          >
            <Text style={[styles.categoryText, { color: theme.text }]}>
              {(() => {
                const category = categories.find(cat => 
                  cat._id === editForm.category || cat.id === editForm.category
                );
                return category?.title || category?.name || 'Select Category';
              })()}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          
          {/* Dropdown List */}
          {showCategoryDropdown && (
            <View style={[styles.dropdownList, { backgroundColor: theme.card }]}>
              <ScrollView style={{ maxHeight: 200 }}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category._id || category.id}
                    style={[
                      styles.dropdownItem,
                      { 
                        backgroundColor: (editForm.category === category._id || editForm.category === category.id) ? theme.primary : 'transparent',
                        borderColor: theme.border
                      }
                    ]}
                    onPress={() => handleCategorySelect(category)}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      { 
                        color: (editForm.category === category._id || editForm.category === category.id) ? '#fff' : theme.text 
                      }
                    ]}>
                      {category.title || category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
         
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.background, color: theme.text }]}
            value={editForm.description}
            onChangeText={(text) => setEditForm({ ...editForm, description: text })}
            placeholder="Enter product description"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Quantity</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            value={editForm.quantity}
            onChangeText={(text) => setEditForm({ ...editForm, quantity: text })}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Product Images</Text>
          <View style={styles.imageContainer}>
            {editForm.images.map((image, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.addImageButton, { backgroundColor: theme.background }]}
              onPress={handleImagePick}
            >
              <Ionicons name="camera-outline" size={24} color={theme.textSecondary} />
              <Text style={[styles.addImageText, { color: theme.textSecondary }]}>
                Add Image
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Try-on overlay (optional PNG with transparency)
          </Text>
          <View style={styles.tryOnRow}>
            {tryOnOverlayNew ? (
              <View style={[styles.tryOnThumbWrap, { borderColor: theme.border }]}>
                <Image source={{ uri: tryOnOverlayNew.uri }} style={styles.tryOnThumb} />
                <TouchableOpacity style={styles.removeTryOnThumb} onPress={clearTryOnOverlay}>
                  <Ionicons name="close-circle" size={24} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ) : tryOnOverlayRemoved ? (
              <TouchableOpacity
                onPress={pickTryOnOverlay}
                style={[styles.tryOnAddBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
              >
                <Ionicons name="shirt-outline" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            ) : selectedProduct?.tryOnOverlay ? (
              <View style={[styles.tryOnThumbWrap, { borderColor: theme.border }]}>
                <Image source={{ uri: selectedProduct.tryOnOverlay }} style={styles.tryOnThumb} />
                <TouchableOpacity style={styles.removeTryOnThumb} onPress={clearTryOnOverlay}>
                  <Ionicons name="close-circle" size={24} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickTryOnOverlay}
                style={[styles.tryOnAddBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
              >
                <Ionicons name="shirt-outline" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.formActions}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: theme.border }]}
          onPress={() => setShowEditForm(false)}
        >
          <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.updateButton, { backgroundColor: theme.primary }]}
          onPress={handleUpdateProduct}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.updateButtonText}>Update Product</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Products</Text>
        <View style={styles.headerRight} />
      </View>

      {showEditForm && (
        <View style={styles.blurOverlay}>
          {renderEditForm()}
        </View>
      )}

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Your Products ({sellerProducts.length})
          </Text>
          {sellerProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                You haven't added any products yet
              </Text>
              <TouchableOpacity
                style={[styles.addProductButton, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('AddProduct')}
              >
                <Text style={styles.addProductButtonText}>Add Your First Product</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sellerProducts.map((product) => (
              <View key={product._id} style={styles.productContainer}>
                {renderProductItem(product)}
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={[styles.floatingAddButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  productContainer: {
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    opacity: 0.7,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  productActions: {
    flexDirection: 'row',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  addProductButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addProductButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  // Edit Form Styles
  editFormContainer: {
    margin: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: '85%',
    width: '95%',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryText: {
    fontSize: 16,
  },
  debugText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageItem: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 10,
    marginTop: 4,
  },
  tryOnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tryOnThumbWrap: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tryOnThumb: {
    width: '100%',
    height: '100%',
  },
  removeTryOnThumb: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  tryOnAddBtn: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProductScreen;
