/**
 * Public sellers API - best sellers for home.
 * @format
 */

import { API_BASE_URL } from './authService';

const API_TIMEOUT_MS = 15000;

/**
 * GET /api/sellers?bestSeller=true - returns sellers with bestSeller true (no auth).
 */
export async function getBestSellers() {
  const url = `${API_BASE_URL}/api/sellers?bestSeller=true`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to load sellers');
    err.response = { status: res.status, data };
    throw err;
  }
  return Array.isArray(data) ? data : [];
}

export function getSellerImageUri(profilePic, baseUrl) {
  if (!profilePic) return null;
  if (profilePic.startsWith('http')) return profilePic;
  const base = baseUrl || API_BASE_URL || '';
  return `${base.replace(/\/$/, '')}/${profilePic.replace(/^\//, '')}`;
}
