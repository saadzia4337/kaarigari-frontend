/**
 * Sign up screen - name, last name, email, password, confirm password, buyer/seller, submit
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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeContext';
import { signUpAsync, clearError } from '../store/slices/authSlice';

export default function SignUpScreen({ navigation }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [streetNumber, setStreetNumber] = useState('');
  const [city, setCity] = useState('');
  const [profilePic, setProfilePic] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  }, [isAuthenticated, navigation]);

  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (error) Alert.alert('Sign up failed', error);
  }, [error]);

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Password and Confirm password must match.');
      return;
    }
    dispatch(
      signUpAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        role,
        streetNumber: streetNumber.trim() || undefined,
        city: city.trim() || undefined,
        profilePic: profilePic ? { uri: profilePic.uri, name: profilePic.fileName || 'profile.jpg', type: profilePic.type || 'image/jpeg' } : undefined,
      })
    );
  };

  const pickProfilePic = () => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: false }, (res) => {
      if (res.didCancel || !res.assets?.[0]) return;
      const asset = res.assets[0];
      setProfilePic({ uri: asset.uri, fileName: asset.fileName || 'profile.jpg', type: asset.type || 'image/jpeg' });
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Sign up</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Create your Kaarigari account
            </Text>
          </View>

          {error ? <Text style={[styles.errorText, { color: '#c62828' }]}>{error}</Text> : null}

          <Text style={[styles.label, { color: theme.text }]}>Profile picture</Text>
          <TouchableOpacity
            onPress={pickProfilePic}
            style={[styles.avatarWrap, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
          >
            {profilePic ? (
              <Image source={{ uri: profilePic.uri }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="camera-outline" size={40} color={theme.muted} />
            )}
          </TouchableOpacity>

          <Text style={[styles.label, { color: theme.text }]}>First name</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text },
            ]}
            placeholder="First name"
            placeholderTextColor={theme.muted}
            value={firstName}
            onChangeText={setFirstName}
            editable={!loading}
          />
          <Text style={[styles.label, { color: theme.text }]}>Last name</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text },
            ]}
            placeholder="Last name"
            placeholderTextColor={theme.muted}
            value={lastName}
            onChangeText={setLastName}
            editable={!loading}
          />
          <Text style={[styles.label, { color: theme.text }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text },
            ]}
            placeholder="your@email.com"
            placeholderTextColor={theme.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          <Text style={[styles.label, { color: theme.text }]}>Password</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text },
            ]}
            placeholder="••••••••"
            placeholderTextColor={theme.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          <Text style={[styles.label, { color: theme.text }]}>Confirm password</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text },
            ]}
            placeholder="••••••••"
            placeholderTextColor={theme.muted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <Text style={[styles.label, { color: theme.text }]}>Address</Text>
          <Text style={[styles.labelSmall, { color: theme.textSecondary }]}>Street number</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text },
            ]}
            placeholder="e.g. 123"
            placeholderTextColor={theme.muted}
            value={streetNumber}
            onChangeText={setStreetNumber}
            editable={!loading}
          />
          <Text style={[styles.labelSmall, { color: theme.textSecondary }]}>City</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text },
            ]}
            placeholder="e.g. Lahore"
            placeholderTextColor={theme.muted}
            value={city}
            onChangeText={setCity}
            editable={!loading}
          />

          <Text style={[styles.label, { color: theme.text }]}>I am a</Text>
          <View style={styles.radioRow}>
            <TouchableOpacity style={styles.radioWrap} onPress={() => setRole('buyer')} disabled={loading}>
              <View style={[styles.radioOuter, { borderColor: theme.border }]}>
                {role === 'buyer' && <View style={[styles.radioInner, { backgroundColor: theme.primary.trim() }]} />}
              </View>
              <Text style={[styles.radioLabel, { color: theme.text }]}>Buyer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.radioWrap} onPress={() => setRole('seller')} disabled={loading}>
              <View style={[styles.radioOuter, { borderColor: theme.border }]}>
                {role === 'seller' && <View style={[styles.radioInner, { backgroundColor: theme.primary.trim() }]} />}
              </View>
              <Text style={[styles.radioLabel, { color: theme.text }]}>Seller</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.primary.trim() }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkWrap}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={[styles.link, { color: theme.primary.trim() }]}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15, marginTop: 8 },
  errorText: { fontSize: 14, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  labelSmall: { fontSize: 12, fontWeight: '500', marginBottom: 6, marginTop: 4 },
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
  radioRow: { flexDirection: 'row', marginBottom: 24, gap: 24 },
  radioWrap: { flexDirection: 'row', alignItems: 'center' },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  radioLabel: { fontSize: 15 },
  btn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkWrap: { alignItems: 'center', marginTop: 24 },
  link: { fontSize: 15 },
});
