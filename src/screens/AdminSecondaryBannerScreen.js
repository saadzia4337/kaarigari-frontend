/**
 * Admin: Secondary Banner - single image + title, subtext
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { selectSecondaryBanner, fetchSecondaryBanner, updateSecondaryBannerAsync } from '../store/slices/bannersSlice';
import { imageUrl } from '../services/productService';
import { launchImageLibrary } from 'react-native-image-picker';

export default function AdminSecondaryBannerScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const banner = useSelector(selectSecondaryBanner);
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [subtext, setSubtext] = useState('');
  const [localUri, setLocalUri] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchSecondaryBanner()).finally(() => setLoading(false));
  }, [dispatch]);

  useEffect(() => {
    if (banner) {
      setTitle(banner.title || '');
      setSubtext(banner.subtext || '');
    }
  }, [banner]);

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, (res) => {
      if (res.didCancel || !res.assets?.[0]?.uri) return;
      setLocalUri(res.assets[0].uri);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('tagline', tagline);
      formData.append('subtext', subtext);
      if (localUri) {
        formData.append('image', {
          uri: localUri,
          type: 'image/jpeg',
          name: 'secondary-banner.jpg',
        });
      }
      await dispatch(updateSecondaryBannerAsync(formData)).unwrap();
      Alert.alert('Success', 'Secondary banner updated');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Secondary Banner</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary?.trim()} />
        </View>
      </SafeAreaView>
    );
  }

  const imageUri = localUri || (banner && (imageUrl(banner.image) || banner.image));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Secondary Banner</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={[styles.imageBox, { backgroundColor: theme.backgroundSecondary }]}
          onPress={pickImage}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : (
            <Ionicons name="add" size={40} color={theme.muted} />
          )}
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
          placeholder="Title"
          placeholderTextColor={theme.muted}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
          placeholder="Tagline"
          placeholderTextColor={theme.muted}
          value={tagline}
          onChangeText={setTagline}
        />
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
          placeholder="Subtext"
          placeholderTextColor={theme.muted}
          value={subtext}
          onChangeText={setSubtext}
        />
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.primary?.trim() }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  imageBox: { height: 140, borderRadius: 12, marginBottom: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  preview: { width: '100%', height: '100%', resizeMode: 'cover' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, fontSize: 15 },
  saveBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
