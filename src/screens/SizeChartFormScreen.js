/**
 * Seller: Add or edit size chart – category + table of rows (measurement label + S/M/L), Add row button.
 * @format
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { selectCategories } from '../store/slices/categoriesSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { createSizeChartAsync, updateSizeChartAsync } from '../store/slices/sizeChartsSlice';

const SIZES = ['S', 'M', 'L'];

const emptyRow = () => ({
  id: Date.now() + Math.random(),
  measurementLabel: '',
  S: '',
  M: '',
  L: '',
});

function chartRowsFromExisting(chart) {
  if (chart?.rows && Array.isArray(chart.rows) && chart.rows.length > 0) {
    return chart.rows.map((r, i) => ({
      id: (r._id || r.id) || `row-${i}-${Date.now()}`,
      measurementLabel: r.measurementLabel ?? '',
      S: r.S ?? '',
      M: r.M ?? '',
      L: r.L ?? '',
    }));
  }
  return [
    {
      id: 'legacy',
      measurementLabel: chart?.measurementLabel ?? '',
      S: chart?.S ?? '',
      M: chart?.M ?? '',
      L: chart?.L ?? '',
    },
  ];
}

export default function SizeChartFormScreen({ navigation, route }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const chartId = route?.params?.chartId;
  const existingChart = route?.params?.chart;
  const isEdit = !!chartId && !!existingChart;

  const categories = useSelector(selectCategories);
  const [category, setCategory] = useState(existingChart?.category || '');
  const [rows, setRows] = useState(() => chartRowsFromExisting(existingChart));
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (existingChart) {
      setCategory(existingChart.category || '');
      setRows(chartRowsFromExisting(existingChart));
    }
  }, [existingChart]);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, emptyRow()]);
  }, []);

  const removeRow = useCallback((id) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  const updateRow = useCallback((id, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }, []);

  const handleSubmit = async () => {
    const cat = category.trim();
    if (!cat) {
      Alert.alert('Required', 'Select a category.');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        category: cat,
        rows: rows.map((r) => ({
          measurementLabel: (r.measurementLabel || '').trim(),
          S: String(r.S ?? '').trim(),
          M: String(r.M ?? '').trim(),
          L: String(r.L ?? '').trim(),
        })),
      };
      if (isEdit) {
        await dispatch(updateSizeChartAsync({ id: chartId, body })).unwrap();
        Alert.alert('Saved', 'Size chart updated.');
      } else {
        await dispatch(createSizeChartAsync(body)).unwrap();
        Alert.alert('Saved', 'Size chart added.');
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{isEdit ? 'Edit size chart' : 'Add size chart'}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: theme.text }]}>Category</Text>
        <TouchableOpacity
          style={[styles.input, styles.selectTouch, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
          onPress={() => setCategoryModalVisible(true)}
        >
          <Text style={{ color: category ? theme.text : theme.textSecondary, fontSize: 16 }}>{category || 'Select category'}</Text>
          <Ionicons name="chevron-down" size={20} color={theme.muted} />
        </TouchableOpacity>

        <Modal visible={categoryModalVisible} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCategoryModalVisible(false)}>
            <View style={[styles.modalContent, { backgroundColor: theme.background }]} onStartShouldSetResponder={() => true}>
              <Text style={[styles.modalTitle, { color: theme.text, borderBottomColor: theme.border }]}>Select category</Text>
              <FlatList
                data={categories}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalRow, { borderBottomColor: theme.border }]}
                    onPress={() => {
                      setCategory(item.title || item.name || '');
                      setCategoryModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalRowText, { color: theme.text }]}>{item.title || item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={[styles.modalEmpty, { color: theme.textSecondary }]}>No categories.</Text>}
              />
              <TouchableOpacity style={[styles.modalCancel, { borderColor: theme.border }]} onPress={() => setCategoryModalVisible(false)}>
                <Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <Text style={[styles.label, { color: theme.text }]}>Chart table</Text>
        <View style={[styles.tableWrap, { borderColor: theme.border }]}>
          <View style={[styles.tableRow, styles.tableHeader, { borderColor: theme.border }]}>
            <Text style={[styles.cellLabel, styles.tableHeaderText, { color: theme.text }]}>Measurement</Text>
            {SIZES.map((s) => (
              <Text key={s} style={[styles.cellSize, styles.tableHeaderText, { color: theme.text }]}>{s}</Text>
            ))}
            <View style={styles.cellRemove} />
          </View>
          {rows.map((row) => (
            <View key={row.id} style={[styles.tableRow, { borderColor: theme.border }]}>
              <TextInput
                style={[styles.cellLabelInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                placeholder="e.g. Chest (inches)"
                placeholderTextColor={theme.muted}
                value={row.measurementLabel}
                onChangeText={(t) => updateRow(row.id, 'measurementLabel', t)}
              />
              {SIZES.map((size) => (
                <TextInput
                  key={size}
                  style={[styles.cellSizeInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  placeholder="-"
                  placeholderTextColor={theme.muted}
                  value={row[size]}
                  onChangeText={(t) => updateRow(row.id, size, t)}
                  keyboardType="decimal-pad"
                />
              ))}
              <TouchableOpacity
                style={styles.removeRowBtn}
                onPress={() => removeRow(row.id)}
                disabled={rows.length <= 1}
              >
                <Ionicons name="trash-outline" size={20} color={rows.length <= 1 ? theme.muted : theme.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.addRowBtn, { borderColor: theme.primary || theme.border }]}
          onPress={addRow}
        >
          <Ionicons name="add" size={22} color={theme.primary || theme.text} />
          <Text style={[styles.addRowText, { color: theme.primary || theme.text }]}>Add row</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: theme.primary?.trim() }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitText}>{isEdit ? 'Update' : 'Add'} size chart</Text>}
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
  scroll: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  selectTouch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 12, maxHeight: 360 },
  modalTitle: { fontSize: 18, fontWeight: '700', padding: 16, borderBottomWidth: 1 },
  modalRow: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  modalRowText: { fontSize: 16 },
  modalEmpty: { padding: 16, textAlign: 'center' },
  modalCancel: { margin: 16, paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  modalCancelText: {},
  tableWrap: { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginBottom: 12 },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  tableHeader: { backgroundColor: 'rgba(0,0,0,0.06)' },
  tableHeaderText: { fontWeight: '700', fontSize: 13 },
  cellLabel: { width: 110, paddingVertical: 10, paddingHorizontal: 8 },
  cellLabelInput: { width: 110, marginVertical: 4, marginLeft: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 8, fontSize: 13 },
  cellSize: { width: 44, paddingVertical: 10, paddingHorizontal: 4, textAlign: 'center' },
  cellSizeInput: { width: 44, marginVertical: 4, marginHorizontal: 2, borderWidth: 1, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 8, fontSize: 12, textAlign: 'center' },
  cellRemove: { width: 36 },
  removeRowBtn: { padding: 8 },
  addRowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 2, borderStyle: 'dashed', borderRadius: 10, marginBottom: 16 },
  addRowText: { fontSize: 15, fontWeight: '600', marginLeft: 6 },
  submitBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
