/**
 * Settings API - primary banner, secondary banner (GET public; PUT admin).
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
 * GET /api/settings/primary-banner - public
 * @returns {Promise<{ slides: Array<{ image, title?, tagline?, cta? }> }>}
 */
export async function getPrimaryBanner() {
  return fetchJson(`${API_BASE_URL}/api/settings/primary-banner`);
}

/**
 * GET /api/settings/secondary-banner - public
 * @returns {Promise<{ image, title?, subtext? }>}
 */
export async function getSecondaryBanner() {
  return fetchJson(`${API_BASE_URL}/api/settings/secondary-banner`);
}

/**
 * PUT /api/settings/primary-banner - admin, multipart: images[] (max 3), title0, tagline0, cta0, title1, tagline1, cta1, title2, tagline2, cta2
 */
export async function updatePrimaryBanner(token, formData) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const res = await fetch(`${API_BASE_URL}/api/settings/primary-banner`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do not set Content-Type; browser will set multipart boundary
    },
    body: formData,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to update primary banner');
    err.response = { status: res.status, data };
    err.userMessage = data.message || 'Failed to update primary banner';
    throw err;
  }
  return data;
}

/**
 * PUT /api/settings/secondary-banner - admin, optional multipart: image, body: title, subtext
 */
export async function updateSecondaryBanner(token, formData) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const res = await fetch(`${API_BASE_URL}/api/settings/secondary-banner`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to update secondary banner');
    err.response = { status: res.status, data };
    err.userMessage = data.message || 'Failed to update secondary banner';
    throw err;
  }
  return data;
}
