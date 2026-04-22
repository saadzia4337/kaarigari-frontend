/**
 * Admin: Categories - list, add (title + image), edit/delete
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import {
  selectCategories,
  fetchCategories,
  createCategoryAsync,
  deleteCategoryAsync,
} from '../store/slices/categoriesSlice';
import { imageUrl } from '../services/productService';
import { launchImageLibrary } from 'react-native-image-picker';

export default function AdminCategoriesScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, (res) => {
      if (res.didCancel || !res.assets?.[0]?.uri) return;
      setImageUri(res.assets[0].uri);
    });
  };

  const resetForm = () => {
    setTitle('');
    setImageUri(null);
    setModalVisible(false);
  };

  const handleAdd = async () => {
    const t = title.trim();
    if (!t) {
      Alert.alert('Required', 'Title is required.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', t);
      if (imageUri) {
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'category.jpg',
        });
      }
      await dispatch(createCategoryAsync(formData)).unwrap();
      resetForm();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to add category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert('Delete', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch(deleteCategoryAsync(item._id)),
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <Image
        source={{ uri: imageUrl(item.image) || item.image || 'https://via.placeholder.com/60' }}
        style={styles.thumb}
      />
      <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
      <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={22} color="#c62828" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Categories</Text>
      </View>
      <FlatList
        data={categories}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No categories yet. Add one below.</Text>
        }
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary?.trim() }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Category</Text>
            <TouchableOpacity
              style={[styles.imageBox, { backgroundColor: theme.backgroundSecondary }]}
              onPress={pickImage}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.preview} />
              ) : (
                <Ionicons name="image-outline" size={40} color={theme.muted} />
              )}
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Title"
              placeholderTextColor={theme.muted}
              value={title}
              onChangeText={setTitle}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.border }]} onPress={resetForm}>
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: theme.primary?.trim() }]}
                onPress={handleAdd}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalBtnTextWhite}>Add</Text>}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  list: { padding: 16, paddingBottom: 80 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  thumb: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  rowTitle: { flex: 1, fontSize: 16 },
  deleteBtn: { padding: 8 },
  empty: { paddingVertical: 24, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  imageBox: { height: 100, borderRadius: 8, marginBottom: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  preview: { width: '100%', height: '100%', resizeMode: 'cover' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, fontSize: 15 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  modalBtnPrimary: { borderWidth: 0 },
  modalBtnText: {},
  modalBtnTextWhite: { color: '#fff', fontWeight: '600' },
});
