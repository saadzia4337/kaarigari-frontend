/**
 * Admin API - list users by role (sellers/buyers) with optional search.
 * @format
 */

import { API_BASE_URL } from './authService';

const API_TIMEOUT_MS = 15000;

/**
 * GET /api/admin/users?role=seller|buyer&search=... - admin only
 * @param {string} token - JWT
 * @param {string} role - 'seller' | 'buyer'
 * @param {string} [search] - optional search term (firstName, lastName, shopName for seller; firstName, lastName, email for buyer)
 * @returns {Promise<Array<{ _id, firstName, lastName, email, role, shopName?, ... }>>}
 */
export async function getUsersByRole(token, role, search = '') {
  const params = new URLSearchParams({ role });
  if (search && String(search).trim()) params.set('search', String(search).trim());
  const url = `${API_BASE_URL}/api/admin/users?${params.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to load users');
    err.response = { status: res.status, data };
    err.userMessage = data.message || 'Failed to load users';
    throw err;
  }
  return data;
}

/**
 * PATCH /api/admin/users/:id - set bestSeller (admin only).
 * @param {string} token - JWT
 * @param {string} userId - _id of seller
 * @param {boolean} bestSeller
 */
export async function updateUserBestSeller(token, userId, bestSeller) {
  const url = `${API_BASE_URL}/api/admin/users/${encodeURIComponent(userId)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bestSeller: !!bestSeller }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to update');
    err.response = { status: res.status, data };
    err.userMessage = data.message || 'Failed to update';
    throw err;
  }
  return data;
}
