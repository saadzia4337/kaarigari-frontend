/**
 * Edit profile - firstName, lastName, profile pic; email read-only. Sellers: shopName, bio.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { updateProfileAsync } from '../store/slices/authSlice';
import { API_BASE_URL, updatePassword } from '../services/authService';

function getProfilePicUri(profilePic) {
  if (!profilePic) return null;
  if (profilePic.startsWith('http')) return profilePic;
  const path = profilePic.replace(/\\/g, '/');
  return `${API_BASE_URL.replace(/\/$/, '')}/${path}`;
}

export default function EditProfileScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [shopName, setShopName] = useState(user?.shopName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [streetNumber, setStreetNumber] = useState(user?.streetNumber || '');
  const [city, setCity] = useState(user?.city || '');
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Password change states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setShopName(user?.shopName || '');
    setBio(user?.bio || '');
    setStreetNumber(user?.streetNumber || '');
    setCity(user?.city || '');
  }, [user]);

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: false }, (res) => {
      if (res.didCancel || !res.assets?.[0]) return;
      const asset = res.assets[0];
      setProfilePic({ uri: asset.uri, name: asset.fileName || 'profile.jpg', type: asset.type || 'image/jpeg' });
    });
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required', 'First name and last name are required.');
      return;
    }
    setLoading(true);
    try {
      await dispatch(
        updateProfileAsync({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          shopName: user?.role === 'seller' ? shopName.trim() : undefined,
          bio: user?.role === 'seller' ? bio.trim() : undefined,
          streetNumber: streetNumber.trim() || undefined,
          city: city.trim() || undefined,
          profilePic: profilePic || undefined,
        })
      ).unwrap();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Update failed', e || 'Could not update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Required', 'Please enter your current password.');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Invalid Password', 'New password must be at least 6 characters long.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirm password do not match.');
      return;
    }
    
    setUpdatingPassword(true);
    try {
      await updatePassword(token, currentPassword, newPassword);
      
      Alert.alert('Success', 'Password updated successfully!', [
        { text: 'OK', onPress: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setShowPasswordSection(false);
        }}
      ]);
    } catch (error) {
      Alert.alert('Update Failed', error.userMessage || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const displayPic = profilePic?.uri || getProfilePicUri(user?.profilePic);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
          {loading ? <ActivityIndicator size="small" color={theme.primary?.trim()} /> : <Text style={[styles.saveText, { color: theme.primary?.trim() }]}>Save</Text>}
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.label, { color: theme.text }]}>Profile picture</Text>
          <TouchableOpacity
            onPress={pickImage}
            style={[styles.avatarWrap, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
          >
            {displayPic ? (
              <Image source={{ uri: displayPic }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="camera-outline" size={40} color={theme.muted} />
            )}
          </TouchableOpacity>

          <Text style={[styles.label, { color: theme.text }]}>First name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor={theme.muted}
            editable={!loading}
          />
          <Text style={[styles.label, { color: theme.text }]}>Last name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor={theme.muted}
            editable={!loading}
          />
          <Text style={[styles.label, { color: theme.text }]}>Email (cannot be changed)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.textSecondary }]}
            value={user?.email || ''}
            editable={false}
          />

          <Text style={[styles.label, { color: theme.text }]}>Street number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
            value={streetNumber}
            onChangeText={setStreetNumber}
            placeholder="e.g. 123"
            placeholderTextColor={theme.muted}
            editable={!loading}
          />
          <Text style={[styles.label, { color: theme.text }]}>City</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Lahore"
            placeholderTextColor={theme.muted}
            editable={!loading}
          />

          {user?.role === 'seller' && (
            <>
              <Text style={[styles.label, { color: theme.text }]}>Shop name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                value={shopName}
                onChangeText={setShopName}
                placeholder="Your shop name"
                placeholderTextColor={theme.muted}
                editable={!loading}
              />
              <Text style={[styles.label, { color: theme.text }]}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Short bio"
                placeholderTextColor={theme.muted}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </>
          )}

          {/* Password Change Section */}
          <TouchableOpacity
            style={[styles.passwordSectionHeader, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
          >
            <Ionicons name="lock-closed-outline" size={20} color={theme.text} />
            <Text style={[styles.passwordSectionTitle, { color: theme.text }]}>Change Password</Text>
            <Ionicons 
              name={showPasswordSection ? "chevron-up-outline" : "chevron-down-outline"} 
              size={20} 
              color={theme.text} 
            />
          </TouchableOpacity>

          {showPasswordSection && (
            <View style={styles.passwordSection}>
              <Text style={[styles.label, { color: theme.text }]}>Current Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={theme.muted}
                secureTextEntry
                editable={!loading && !updatingPassword}
              />

              <Text style={[styles.label, { color: theme.text }]}>New Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min 6 characters)"
                placeholderTextColor={theme.muted}
                secureTextEntry
                editable={!loading && !updatingPassword}
              />

              <Text style={[styles.label, { color: theme.text }]}>Confirm New Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={theme.muted}
                secureTextEntry
                editable={!loading && !updatingPassword}
              />

              <TouchableOpacity
                style={[styles.updatePasswordBtn, { backgroundColor: theme.primary }]}
                onPress={handlePasswordUpdate}
                disabled={updatingPassword || loading}
              >
                {updatingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.updatePasswordBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  saveBtn: { minWidth: 60, alignItems: 'flex-end' },
  saveText: { fontSize: 16, fontWeight: '600' },
  kav: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  bioInput: { height: 80, paddingTop: 12 },
  passwordSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  passwordSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  passwordSection: {
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  updatePasswordBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  updatePasswordBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
