/**
 * Categories API - list (public), create/update/delete (admin).
 * @format
 */

import { API_BASE_URL } from './authService';

const API_TIMEOUT_MS = 15000;

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const res = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(timeoutId);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.response = { status: res.status, data };
    err.userMessage = data.message || 'Request failed';
    throw err;
  }
  return data;
}

/**
 * GET /api/categories - public
 * @returns {Promise<Array<{ _id, title, image }>>}
 */
export async function getCategories() {
  return fetchJson(`${API_BASE_URL}/api/categories`);
}

/**
 * POST /api/categories - admin, multipart: image, title
 */
export async function createCategory(token, formData) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const res = await fetch(`${API_BASE_URL}/api/categories`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to create category');
    err.response = { status: res.status, data };
    err.userMessage = data.message || 'Failed to create category';
    throw err;
  }
  return data;
}

/**
 * PATCH /api/categories/:id - admin, optional multipart: image, body: title
 */
export async function updateCategory(token, id, formData) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to update category');
    err.response = { status: res.status, data };
    err.userMessage = data.message || 'Failed to update category';
    throw err;
  }
  return data;
}

/**
 * DELETE /api/categories/:id - admin
 */
export async function deleteCategory(token, id) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  if (res.status === 204 || res.ok) return;
  const data = await res.json();
  const err = new Error(data.message || 'Failed to delete category');
  err.response = { status: res.status, data };
  err.userMessage = data.message || 'Failed to delete category';
  throw err;
}
