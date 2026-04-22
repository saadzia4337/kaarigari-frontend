/**
 * Add product - title, description, category, quantity, price, 1-5 images.
 * Seller only; uses Redux createProductAsync and fetch.
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { createProductAsync, clearProductsError } from '../store/slices/productsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { selectCategories } from '../store/slices/categoriesSlice';

const MAX_IMAGES = 5;
const SIZE_OPTIONS = ['S', 'M', 'L'];

export default function AddProductScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { createLoading, error } = useSelector((state) => state.products);
  const categories = useSelector(selectCategories);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [sizes, setSizes] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const toggleSize = (size) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const pickImages = () => {
    const remaining = MAX_IMAGES - selectedImages.length;
    if (remaining < 1) {
      Alert.alert('Limit', 'You can add at most 5 images.');
      return;
    }
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: false, selectionLimit: remaining },
      (res) => {
        if (res.didCancel || !res.assets?.length) return;
        const newAssets = res.assets.slice(0, remaining).map((a) => ({
          uri: a.uri,
          name: a.fileName || `image_${Date.now()}.jpg`,
          type: a.type || 'image/jpeg',
        }));
        setSelectedImages((prev) => [...prev, ...newAssets].slice(0, MAX_IMAGES));
      }
    );
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const t = title.trim();
    const d = description.trim();
    const q = Number(quantity);
    const p = Number(price);
    if (!t) {
      Alert.alert('Required', 'Title is required.');
      return;
    }
    if (!d) {
      Alert.alert('Required', 'Description is required.');
      return;
    }
    if (selectedImages.length < 1) {
      Alert.alert('Required', 'Add at least 1 image (up to 5).');
      return;
    }
    if (selectedImages.length > MAX_IMAGES) {
      Alert.alert('Limit', 'Maximum 5 images allowed.');
      return;
    }
    if (isNaN(q) || q < 0) {
      Alert.alert('Invalid', 'Quantity must be a non-negative number.');
      return;
    }
    if (isNaN(p) || p < 0) {
      Alert.alert('Invalid', 'Price must be a non-negative number.');
      return;
    }
    if (sizes.length < 1) {
      Alert.alert('Required', 'Select at least one size (S, M, or L) that you will offer for this product.');
      return;
    }

    const formData = new FormData();
    formData.append('title', t);
    formData.append('description', d);
    formData.append('category', (category || '').trim());
    formData.append('quantity', String(q));
    formData.append('price', String(p));
    formData.append('sizes', JSON.stringify(sizes));
    selectedImages.forEach((img) => {
      formData.append('images', {
        uri: img.uri,
        name: img.name || 'image.jpg',
        type: img.type || 'image/jpeg',
      });
    });

    try {
      await dispatch(createProductAsync(formData)).unwrap();
      dispatch(clearProductsError());
      navigation.goBack();
    } catch (e) {
      Alert.alert('Failed', e || 'Could not create product.');
    }
  };

  const primary = (theme.primary && theme.primary.trim && theme.primary.trim()) || '#6366f1';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add product</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {error ? (
            <Text style={[styles.errorText, { color: '#c62828' }]}>{error}</Text>
          ) : null}

          <Text style={[styles.label, { color: theme.text }]}>Images (1–5)</Text>
          <View style={styles.imageRow}>
            {selectedImages.map((img, index) => (
              <View key={index} style={[styles.thumbWrap, { borderColor: theme.border }]}>
                <Image source={{ uri: img.uri }} style={styles.thumb} />
                <TouchableOpacity
                  style={styles.removeThumb}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#c62828" />
                </TouchableOpacity>
              </View>
            ))}
            {selectedImages.length < MAX_IMAGES ? (
              <TouchableOpacity
                onPress={pickImages}
                style={[styles.addThumb, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
              >
                <Ionicons name="add" size={32} color={theme.muted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={[styles.label, { color: theme.text }]}>Title</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Product title"
            placeholderTextColor={theme.textSecondary}
          />
          <Text style={[styles.label, { color: theme.text }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
          />
          <Text style={[styles.label, { color: theme.text }]}>Category</Text>
          <TouchableOpacity
            style={[styles.input, styles.selectTouch, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Text style={{ color: category ? theme.text : theme.textSecondary, fontSize: 16 }}>
              {(() => {
                if (!category) return 'Select category';
                const selectedCategoryObj = categories.find(cat => cat._id === category);
                return selectedCategoryObj?.title || selectedCategoryObj?.name || 'Select category';
              })()}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.muted} />
          </TouchableOpacity>

          <Modal
            visible={categoryModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setCategoryModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setCategoryModalVisible(false)}
            >
              <View style={[styles.modalContent, { backgroundColor: theme.background }]} onStartShouldSetResponder={() => true}>
                <Text style={[styles.modalTitle, { color: theme.text, borderBottomColor: theme.border }]}>Select category</Text>
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.modalRow, { borderBottomColor: theme.border }]}
                      onPress={() => {
                        setCategory(item._id || '');
                        setCategoryModalVisible(false);
                      }}
                    >
                      <Text style={[styles.modalRowText, { color: theme.text }]}>{item.title || item.name}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={[styles.modalEmpty, { color: theme.textSecondary }]}>No categories. Add from Admin.</Text>}
                />
                <TouchableOpacity
                  style={[styles.modalCancel, { borderColor: theme.border }]}
                  onPress={() => setCategoryModalVisible(false)}
                >
                  <Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
          <Text style={[styles.label, { color: theme.text }]}>Sizes (select all that you will offer)</Text>
          <View style={styles.sizeRow}>
            {SIZE_OPTIONS.map((size) => {
              const isSelected = sizes.includes(size);
              return (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeChip,
                    { borderColor: theme.border, backgroundColor: isSelected ? primary : theme.backgroundSecondary },
                  ]}
                  onPress={() => toggleSize(size)}
                >
                  {isSelected ? (
                    <Ionicons name="checkbox" size={22} color="#fff" />
                  ) : (
                    <Ionicons name="square-outline" size={22} color={theme.textSecondary} />
                  )}
                  <Text style={[styles.sizeChipText, { color: isSelected ? '#fff' : theme.text }]}>{size}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { color: theme.text }]}>Quantity</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
          <Text style={[styles.label, { color: theme.text }]}>Price</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: primary }]}
            onPress={handleSubmit}
            disabled={createLoading}
          >
            {createLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>Add product</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  kav: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  errorText: { marginBottom: 12, fontSize: 14 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  selectTouch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 12, maxHeight: 360 },
  modalTitle: { fontSize: 18, fontWeight: '700', padding: 16, borderBottomWidth: 1 },
  modalRow: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  modalRowText: { fontSize: 16 },
  modalEmpty: { padding: 16, textAlign: 'center' },
  modalCancel: { margin: 16, paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  modalCancelText: { fontSize: 16 },
  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  sizeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  sizeChipText: { fontSize: 16, fontWeight: '600' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 10 },
  thumbWrap: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  removeThumb: { position: 'absolute', top: 2, right: 2 },
  addThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
