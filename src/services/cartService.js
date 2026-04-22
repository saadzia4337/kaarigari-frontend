/**
 * Cart API - get cart, add item, remove item, update qty.
 * All endpoints require auth. Cart is per user in database.
 * @format
 */

import { API_BASE_URL } from './authService';
import { normalizeProduct } from './productService';

const API_TIMEOUT_MS = 15000;

/**
 * Parse API cart doc into items shape: [{ id, product, qty, size, customSize }]
 */
export function parseCartResponse(cartDoc) {
  if (!cartDoc || !Array.isArray(cartDoc.items)) return [];
  return cartDoc.items
    .filter((i) => i.product)
    .map((i) => ({
      id: i.product._id,
      product: normalizeProduct(i.product),
      qty: i.qty || 1,
      size: i.size != null ? String(i.size).trim() : '',
      customSize: i.customSize || null,
    }));
}

/**
 * GET /api/cart - get current user's cart
 */
export async function getCart(token) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const response = await fetch(`${API_BASE_URL}/api/cart`, {
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
    const err = new Error(data.message || 'Failed to load cart');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to load cart';
    throw err;
  }
  return parseCartResponse(data);
}

/**
 * POST /api/cart/items - add item. Body: { productId, qty, size (optional), customSize (optional) }
 */
export async function addCartItem(token, productId, qty = 1, size, customSize) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const body = { productId, qty };
  if (size != null && String(size).trim() !== '') body.size = String(size).trim();
  if (customSize && Object.keys(customSize).some(key => customSize[key])) {
    body.customSize = customSize;
  }
  const response = await fetch(`${API_BASE_URL}/api/cart/items`, {
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
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.message || 'Failed to add to cart');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to add to cart';
    throw err;
  }
  return parseCartResponse(data);
}

/**
 * DELETE /api/cart/items/:productId?size= - remove item (optional size for same product different size)
 */
export async function removeCartItem(token, productId, size) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  let url = `${API_BASE_URL}/api/cart/items/${encodeURIComponent(productId)}`;
  if (size != null && String(size).trim() !== '') {
    url += `?size=${encodeURIComponent(String(size).trim())}`;
  }
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.message || 'Failed to remove from cart');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to remove from cart';
    throw err;
  }
  return parseCartResponse(data);
}

/**
 * PATCH /api/cart/items/:productId - update qty. Body: { qty, size (optional) }
 */
export async function updateCartItemQty(token, productId, qty, size) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const body = { qty };
  if (size != null && String(size).trim() !== '') body.size = String(size).trim();
  const response = await fetch(
    `${API_BASE_URL}/api/cart/items/${encodeURIComponent(productId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    }
  );
  clearTimeout(timeoutId);
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.message || 'Failed to update cart');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to update cart';
    throw err;
  }
  return parseCartResponse(data);
}
