/**
 * Wishlist API - get wishlist, add item, remove item.
 * All endpoints require auth. Wishlist is per user in database.
 * @format
 */

import { API_BASE_URL } from './authService';
import { normalizeProduct } from './productService';

const API_TIMEOUT_MS = 15000;

/**
 * Parse API wishlist doc into array of normalized products
 */
export function parseWishlistResponse(wishlistDoc) {
  if (!wishlistDoc || !Array.isArray(wishlistDoc.products)) return [];
  return wishlistDoc.products
    .filter((p) => p && p._id)
    .map((p) => normalizeProduct(p));
}

/**
 * GET /api/wishlist - get current user's wishlist
 */
export async function getWishlist(token) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.message || 'Failed to load wishlist');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to load wishlist';
    throw err;
  }
  return parseWishlistResponse(data);
}

/**
 * POST /api/wishlist/items - add product. Body: { productId }
 */
export async function addWishlistItem(token, productId) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const response = await fetch(`${API_BASE_URL}/api/wishlist/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.message || 'Failed to add to wishlist');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to add to wishlist';
    throw err;
  }
  return parseWishlistResponse(data);
}

/**
 * DELETE /api/wishlist/items/:productId - remove product
 */
export async function removeWishlistItem(token, productId) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const response = await fetch(
    `${API_BASE_URL}/api/wishlist/items/${encodeURIComponent(productId)}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    }
  );
  clearTimeout(timeoutId);
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.message || 'Failed to remove from wishlist');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to remove from wishlist';
    throw err;
  }
  return parseWishlistResponse(data);
}
