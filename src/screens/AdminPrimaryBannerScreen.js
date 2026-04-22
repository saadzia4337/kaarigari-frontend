/**
 * Admin: Primary Banner - add/change up to 3 slides (image + title, tagline, cta per slide)
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
import { selectPrimarySlides, fetchPrimaryBanner, updatePrimaryBannerAsync } from '../store/slices/bannersSlice';
import { imageUrl } from '../services/productService';
import { launchImageLibrary } from 'react-native-image-picker';

const MAX_SLIDES = 3;

export default function AdminPrimaryBannerScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const slides = useSelector(selectPrimarySlides);
  const [localSlides, setLocalSlides] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchPrimaryBanner()).finally(() => setLoading(false));
  }, [dispatch]);

  useEffect(() => {
    if (slides && slides.length > 0) {
      const padded = [...slides];
      while (padded.length < MAX_SLIDES) padded.push({ image: '', title: '', tagline: '', cta: '' });
      setLocalSlides(padded.slice(0, MAX_SLIDES));
    } else {
      setLocalSlides(
        Array.from({ length: MAX_SLIDES }, () => ({ image: '', title: '', tagline: '', cta: '' }))
      );
    }
  }, [slides]);

  const pickImage = (index) => {
    launchImageLibrary({ mediaType: 'photo' }, (res) => {
      if (res.didCancel || !res.assets?.[0]?.uri) return;
      const uri = res.assets[0].uri;
      setLocalSlides((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], image: uri, localUri: uri };
        return next;
      });
    });
  };

  const updateSlide = (index, field, value) => {
    setLocalSlides((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const buildFormData = () => {
    const formData = new FormData();
    localSlides.forEach((s, i) => {
      formData.append(`title${i}`, s.title != null ? String(s.title) : '');
      formData.append(`tagline${i}`, s.tagline != null ? String(s.tagline) : '');
      formData.append(`cta${i}`, s.cta != null ? String(s.cta) : '');
      if (s.localUri) {
        formData.append(`image${i}`, {
          uri: s.localUri,
          type: 'image/jpeg',
          name: `slide-${i}.jpg`,
        });
      }
    });
    return formData;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = buildFormData();
      await dispatch(updatePrimaryBannerAsync(formData)).unwrap();
      Alert.alert('Success', 'Primary banner updated');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Primary Banner</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary?.trim()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Primary Banner (max 3)</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {localSlides.map((slide, index) => (
          <View key={index} style={[styles.slideCard, { borderColor: theme.border }]}>
            <Text style={[styles.slideLabel, { color: theme.text }]}>Slide {index + 1}</Text>
            <TouchableOpacity
              style={[styles.imageBox, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => pickImage(index)}
            >
              {slide.localUri ? (
                <Image source={{ uri: slide.localUri }} style={styles.preview} />
              ) : slide.image ? (
                <Image source={{ uri: imageUrl(slide.image) || slide.image }} style={styles.preview} />
              ) : (
                <Ionicons name="add" size={40} color={theme.muted} />
              )}
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Title"
              placeholderTextColor={theme.muted}
              value={slide.title || ''}
              onChangeText={(t) => updateSlide(index, 'title', t)}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Tagline"
              placeholderTextColor={theme.muted}
              value={slide.tagline || ''}
              onChangeText={(t) => updateSlide(index, 'tagline', t)}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="CTA (e.g. Shop Now)"
              placeholderTextColor={theme.muted}
              value={slide.cta || ''}
              onChangeText={(t) => updateSlide(index, 'cta', t)}
            />
          </View>
        ))}
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
  slideCard: { marginBottom: 20, padding: 16, borderWidth: 1, borderRadius: 12 },
  slideLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  imageBox: { height: 120, borderRadius: 8, marginBottom: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  preview: { width: '100%', height: '100%', resizeMode: 'cover' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, fontSize: 15 },
  saveBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
