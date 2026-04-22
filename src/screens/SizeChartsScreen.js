/**
 * Seller: List size charts by category, add / edit / delete
 * @format
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import {
  selectSizeChartsList,
  selectSizeChartsLoading,
  fetchSizeChartsBySeller,
  deleteSizeChartAsync,
} from '../store/slices/sizeChartsSlice';

export default function SizeChartsScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const sellerId = user?._id;
  const list = useSelector(selectSizeChartsList);
  const loading = useSelector(selectSizeChartsLoading);

  useEffect(() => {
    if (sellerId) dispatch(fetchSizeChartsBySeller(sellerId));
  }, [dispatch, sellerId]);

  const handleDelete = (item) => {
    Alert.alert('Delete', `Delete size chart for "${item.category}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch(deleteSizeChartAsync(item._id)),
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <View style={styles.rowContent}>
        <Text style={[styles.rowCategory, { color: theme.text }]}>{item.category || '—'}</Text>
        <Text style={[styles.rowLabel, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.measurementLabel ? `${item.measurementLabel}: S=${item.S} M=${item.M} L=${item.L} …` : 'No measurement'}
        </Text>
      </View>
      <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('SizeChartForm', { chartId: item._id, chart: item })}>
        <Ionicons name="pencil-outline" size={22} color={theme.primary?.trim() || theme.text} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Size charts</Text>
      </View>
      {loading && list.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary?.trim()} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={[styles.empty, { color: theme.textSecondary }]}>No size charts. Add one per category.</Text>}
        />
      )}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary?.trim() }]}
        onPress={() => navigation.navigate('SizeChartForm')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  list: { padding: 16, paddingBottom: 80 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  rowContent: { flex: 1, minWidth: 0 },
  rowCategory: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  rowLabel: { fontSize: 13 },
  editBtn: { padding: 8 },
  deleteBtn: { padding: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { paddingVertical: 24, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
