import axios from 'axios';
import { Platform } from 'react-native';
import { API_HOST_OVERRIDE } from '../config/api';

const API_PORT = '5000';
// Android emulator: 10.0.2.2. Physical device: set API_HOST_OVERRIDE in src/config/api.js to your PC IP.
const androidHost = API_HOST_OVERRIDE || '10.0.2.2';
export const API_BASE_URL =
  Platform.OS === 'android'
    ? `http://${androidHost}:${API_PORT}`
    : `http://localhost:${API_PORT}`;

const API_TIMEOUT_MS = 15000;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Hello API - health check / connectivity test.
 * @returns {Promise<{ message: string }>}
 */
export async function getHello() {
  const { data } = await api.get('/api/hello');
  return data;
}

/**
 * Login with email and password.
 * @returns {Promise<{ _id, firstName, lastName, email, role, profilePic, token }>}
 */
export async function login(email, password) {
  const payload = { email, password };
  console.log('[authService] login — payload sent:', { email, password: password ? '***' : '' });
  try {
    const response = await api.post('/api/auth/login', payload);
    console.log('[authService] login — response status:', response.status);
    console.log('[authService] login — response received:', {
      ...response.data,
      token: response.data?.token ? `${response.data.token.slice(0, 20)}...` : response.data?.token,
    });
    return response.data;
  } catch (err) {
    const message = err.code === 'ECONNABORTED'
      ? 'Request timed out. Is the server running?'
      : err.response?.data?.message || err.message || 'Network error. Using a physical device? Set your PC IP in src/config/api.js (see file comment).';
    console.log('[authService] login — error:', err.code, err.message, err.response?.status, err.response?.data);
    throw Object.assign(err, { userMessage: message });
  }
}

/**
 * Sign up with form data. Pass profilePic as { uri, name, type } for file upload.
 * Uses fetch() so FormData works reliably in React Native (axios multipart can fail).
 */
export async function signUp(payload) {
  console.log('[authService] signUp — payload sent:', {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    role: payload.role,
    hasProfilePic: !!(payload.profilePic && payload.profilePic.uri),
  });
  const formData = new FormData();
  formData.append('firstName', payload.firstName);
  formData.append('lastName', payload.lastName);
  formData.append('email', payload.email);
  formData.append('password', payload.password);
  formData.append('confirmPassword', payload.confirmPassword);
  formData.append('role', payload.role || 'buyer');
  if (payload.streetNumber !== undefined) formData.append('streetNumber', payload.streetNumber);
  if (payload.city !== undefined) formData.append('city', payload.city);
  if (payload.profilePic && payload.profilePic.uri) {
    formData.append('profilePic', {
      uri: payload.profilePic.uri,
      name: payload.profilePic.name || 'profile.jpg',
      type: payload.profilePic.type || 'image/jpeg',
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok) throw { response: { status: response.status, data } };
    return data;
  } catch (err) {
    const message = err.name === 'AbortError'
      ? 'Request timed out. Is the server running?'
      : err.response?.data?.message || err.message || 'Network error. Using a physical device? Set your PC IP in src/config/api.js (see file comment).';
    throw Object.assign(err, { userMessage: message });
  }
}

/**
 * Update profile (firstName, lastName, profilePic; sellers: shopName, bio). Email cannot be changed.
 * Uses fetch() so FormData works reliably in React Native.
 */
export async function updateProfile(token, payload) {
  const formData = new FormData();
  if (payload.firstName !== undefined) formData.append('firstName', payload.firstName);
  if (payload.lastName !== undefined) formData.append('lastName', payload.lastName);
  if (payload.shopName !== undefined) formData.append('shopName', payload.shopName);
  if (payload.bio !== undefined) formData.append('bio', payload.bio);
  if (payload.streetNumber !== undefined) formData.append('streetNumber', payload.streetNumber);
  if (payload.city !== undefined) formData.append('city', payload.city);
  if (payload.profilePic && payload.profilePic.uri) {
    formData.append('profilePic', {
      uri: payload.profilePic.uri,
      name: payload.profilePic.name || 'profile.jpg',
      type: payload.profilePic.type || 'image/jpeg',
    });
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    body: formData,
    signal: controller.signal,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  clearTimeout(timeoutId);
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.message || 'Update failed'), { response: { data } });
  return data;
}
