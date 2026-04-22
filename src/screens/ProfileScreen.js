/**
 * Profile screen - buyer: My Profile, My orders, Wishlist, Logout. Seller: My Profile, All orders, Add Products, Logout.
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
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { logoutAsync } from '../store/slices/authSlice';
import { API_BASE_URL } from '../services/authService';

function getProfilePicUri(profilePic) {
  if (!profilePic) return null;
  if (profilePic.startsWith('http')) return profilePic;
  const path = profilePic.replace(/\\/g, '/');
  return `${API_BASE_URL.replace(/\/$/, '')}/${path}`;
}

function MenuRow({ icon, label, onPress, theme }) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, { borderBottomColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={22} color={theme.primary?.trim() || theme.text} />
      <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={theme.muted} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const goToLogin = () => navigation.navigate('Login');
  const handleLogout = () => dispatch(logoutAsync());
  const goToEdit = () => navigation.navigate('EditProfile');
  const goToWishlist = () => navigation.navigate('Wishlist');
  const goToCart = () => navigation.navigate('Cart');
  const goToMyPersonalDetails = () => navigation.navigate('MyPersonalDetails');
  const goToMyOrders = () => navigation.navigate('MyOrders');
  const goToAllOrders = () => navigation.navigate('AllOrders');
  const goToSellerPurchases = () => navigation.navigate('SellerPurchases');
  const goToSellerProfile = () => {
    const profilePicUriForSeller = getProfilePicUri(user?.profilePic);
    navigation.navigate('SellerProfile', {
      seller: {
        id: user._id,
        name: user?.shopName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Seller',
        image: profilePicUriForSeller || 'https://picsum.photos/seed/seller/120/120',
      },
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.guestContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <Ionicons name="person-outline" size={64} color={theme.muted} />
          </View>
          <Text style={[styles.greeting, { color: theme.text }]}>Welcome to Kaarigari</Text>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            Login to manage your orders, messages and tailor profile
          </Text>
          <TouchableOpacity style={[styles.loginBtn, { backgroundColor: theme.primary?.trim() }]} onPress={goToLogin}>
            <Ionicons name="log-in-outline" size={22} color="#fff" />
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const profilePicUri = getProfilePicUri(user.profilePic);
  const isSeller = user.role === 'seller';
  const isAdmin = user.role === 'admin';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {user.firstName} {user.lastName}
        </Text>
        {/* <TouchableOpacity onPress={goToEdit} style={styles.editBtn}>
          <Ionicons name="pencil" size={22} color={theme.primary?.trim() || theme.text} />
          <Text style={[styles.editBtnText, { color: theme.primary?.trim() || theme.text }]}>Edit</Text>
        </TouchableOpacity> */}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* My profile - when seller, tap to open SellerProfileScreen; admin has no profile card */}
        {!isAdmin && (
          <TouchableOpacity
            activeOpacity={isSeller ? 0.7 : 1}
            onPress={isSeller ? goToSellerProfile : undefined}
            disabled={!isSeller}
            style={[styles.profileCard, styles.myProfileRow, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
          >
            <Text style={[styles.myProfileLabel, { color: theme.text }]}>My profile</Text>
            {isSeller && <Ionicons name="chevron-forward" size={20} color={theme.muted} />}
          </TouchableOpacity>
        )}

        <View style={[styles.section, { borderTopColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Menu</Text>
          {isAdmin ? (
            <>
              <MenuRow icon="images-outline" label="Primary Banner" onPress={() => navigation.navigate('AdminPrimaryBanner')} theme={theme} />
              <MenuRow icon="image-outline" label="Secondary Banner" onPress={() => navigation.navigate('AdminSecondaryBanner')} theme={theme} />
              <MenuRow icon="pricetag-outline" label="Add Category" onPress={() => navigation.navigate('AdminCategories')} theme={theme} />
              <MenuRow icon="storefront-outline" label="Show All Sellers" onPress={() => navigation.navigate('AllSellers')} theme={theme} />
              <MenuRow icon="people-outline" label="Show All Buyers" onPress={() => navigation.navigate('AllBuyers')} theme={theme} />
                <MenuRow icon="receipt-outline" label="My orders" onPress={goToMyOrders} theme={theme} />
            </>
          ) : isSeller ? (
            <>
              <MenuRow icon="person-outline" label="My personal details" onPress={goToMyPersonalDetails} theme={theme} />
              <MenuRow icon="cart-outline" label="My purchases" onPress={goToSellerPurchases} theme={theme} />
              <MenuRow icon="receipt-outline" label="All orders" onPress={goToAllOrders} theme={theme} />
              <MenuRow icon="add-circle-outline" label="Add product" onPress={() => navigation.navigate('AddProduct')} theme={theme} />
              <MenuRow icon="resize-outline" label="Size charts" onPress={() => navigation.navigate('SizeCharts')} theme={theme} />
            </>
          ) : (
            <>
              <MenuRow icon="receipt-outline" label="My orders" onPress={goToMyOrders} theme={theme} />
              <MenuRow icon="heart-outline" label="Wishlist" onPress={goToWishlist} theme={theme} />
            </>
          )}
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: theme.border }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color="#c62828" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editBtnText: { fontSize: 16, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  guestContent: { padding: 20, alignItems: 'center', paddingTop: 48 },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  hint: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 16 },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12, minWidth: 200 },
  loginBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },

  profileCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardChevron: { marginLeft: 8 },
  myProfileRow: { justifyContent: 'space-between' },
  myProfileLabel: { fontSize: 16, fontWeight: '600' },
  profileRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 16,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { fontSize: 24, fontWeight: '700' },
  profileInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 4 },
  roleBadge: { fontSize: 12, fontWeight: '600', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  address: { fontSize: 13, marginTop: 6 },
  bio: { fontSize: 13, marginTop: 6 },

  section: { marginTop: 24, paddingTop: 16, paddingHorizontal: 20, borderTopWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  menuLabel: { fontSize: 16, flex: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: { color: '#c62828', fontSize: 16, fontWeight: '600' },
});
