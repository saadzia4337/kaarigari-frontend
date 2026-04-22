/**
 * Size charts API - list by seller, get by seller+category, create/update/delete (seller).
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

export async function getChartsBySeller(sellerId) {
  const params = new URLSearchParams({ sellerId });
  return fetchJson(`${API_BASE_URL}/api/size-charts?${params.toString()}`);
}

export async function getChartBySellerAndCategory(sellerId, category) {
  const params = new URLSearchParams({ sellerId, category: category || '' });
  const url = `${API_BASE_URL}/api/size-charts/by-seller-category?${params.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  const data = await res.json();
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.response = { status: res.status, data };
    err.userMessage = data.message || 'Request failed';
    throw err;
  }
  return data;
}

export async function createChart(token, body) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const res = await fetch(`${API_BASE_URL}/api/size-charts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to create size chart');
    err.response = { status: res.status, data };
    err.userMessage = data.message || 'Failed to create size chart';
    throw err;
  }
  return data;
}

export async function updateChart(token, id, body) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const res = await fetch(`${API_BASE_URL}/api/size-charts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to update size chart');
    err.response = { status: res.status, data };
    err.userMessage = data.message || 'Failed to update size chart';
    throw err;
  }
  return data;
}

export async function deleteChart(token, id) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const res = await fetch(`${API_BASE_URL}/api/size-charts/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  if (res.status === 204 || res.ok) return;
  const data = await res.json();
  const err = new Error(data.message || 'Failed to delete size chart');
  err.response = { status: res.status, data };
  err.userMessage = data.message || 'Failed to delete size chart';
  throw err;
}
