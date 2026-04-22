/**
 * Admin: List all buyers with search (first name, last name)
 * @format
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { getUsersByRole } from '../services/adminService';

const SEARCH_DEBOUNCE_MS = 400;

export default function AllBuyersScreen({ navigation }) {
  const theme = useTheme();
  const token = useSelector((state) => state.auth.token);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    getUsersByRole(token, 'buyer', debouncedSearch)
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.userMessage || err.message))
      .finally(() => setLoading(false));
  }, [token, debouncedSearch]);

  const renderItem = useCallback(
    ({ item }) => {
      const name = [item.firstName, item.lastName].filter(Boolean).join(' ') || '—';
      return (
        <View style={[styles.row, { borderColor: theme.border }]}>
          <View style={styles.rowContent}>
            <Text style={[styles.rowName, { color: theme.text }]}>{name}</Text>
            {item.email ? <Text style={[styles.rowEmail, { color: theme.muted }]} numberOfLines={1}>{item.email}</Text> : null}
          </View>
        </View>
      );
    },
    [theme]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>All Buyers</Text>
      </View>
      <View style={[styles.searchWrap, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.muted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search by first name, last name..."
          placeholderTextColor={theme.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {loading && list.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary?.trim()} />
        </View>
      ) : error ? (
        <Text style={[styles.error, { color: '#c62828' }]}>{error}</Text>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={[styles.empty, { color: theme.textSecondary }]}>No buyers found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', margin: 16, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  rowContent: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  rowEmail: { fontSize: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { padding: 16 },
  empty: { paddingVertical: 24, textAlign: 'center' },
});
