/**
 * My personal details - full seller profile view with Edit at top right.
 * @format
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { API_BASE_URL } from '../services/authService';

function getProfilePicUri(profilePic) {
  if (!profilePic) return null;
  if (profilePic.startsWith('http')) return profilePic;
  const path = profilePic.replace(/\\/g, '/');
  return `${API_BASE_URL.replace(/\/$/, '')}/${path}`;
}

function DetailRow({ icon, label, value, theme }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
      <Ionicons name={icon} size={20} color={theme.primary?.trim() || theme.text} />
      <View style={styles.detailContent}>
        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function MyPersonalDetailsScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  const profilePicUri = user ? getProfilePicUri(user.profilePic) : null;

  const goToEdit = () => navigation.navigate('EditProfile');

  if (!user) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My personal details</Text>
        <TouchableOpacity onPress={goToEdit} style={styles.editBtn}>
          <Ionicons name="pencil" size={22} color={theme.primary?.trim() || theme.text} />
          <Text style={[styles.editBtnText, { color: theme.primary?.trim() || theme.text }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.avatarWrap, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          {profilePicUri ? (
            <Image source={{ uri: profilePicUri }} style={styles.avatarImg} />
          ) : (
            <Text style={[styles.avatarText, { color: theme.primary?.trim() }]}>
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0) || ''}
            </Text>
          )}
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{user.firstName} {user.lastName}</Text>
        <Text style={[styles.roleBadge, { color: theme.text, borderColor: theme.border }]}>
          {user.role === 'seller' ? (user.shopName || 'Seller') : 'Buyer'}
        </Text>

        <View style={[styles.section, { borderTopColor: theme.border }]}>
          <DetailRow icon="mail-outline" label="Email" value={user.email} theme={theme} />
          <DetailRow icon="person-outline" label="First name" value={user.firstName} theme={theme} />
          <DetailRow icon="person-outline" label="Last name" value={user.lastName} theme={theme} />
          {user.role === 'seller' && (
            <>
              <DetailRow icon="storefront-outline" label="Shop name" value={user.shopName} theme={theme} />
              <DetailRow icon="document-text-outline" label="Bio" value={user.bio} theme={theme} />
            </>
          )}
          <DetailRow icon="location-outline" label="Street number" value={user.streetNumber} theme={theme} />
          <DetailRow icon="business-outline" label="City" value={user.city} theme={theme} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editBtnText: { fontSize: 16, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { fontSize: 36, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  roleBadge: { fontSize: 14, fontWeight: '600', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 24 },
  section: { width: '100%', marginTop: 8, paddingTop: 16, borderTopWidth: 1 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, marginBottom: 2 },
  detailValue: { fontSize: 16 },
});
