/**
 * Products API - list, get by id, create (multipart).
 * Uses same base URL as auth for image URLs. Uses fetch() for create (FormData in RN).
 * @format
 */

import { API_BASE_URL } from './authService';

const API_TIMEOUT_MS = 15000;

/**
 * Build full URL for an image path (e.g. uploads/123.jpg -> http://host:5000/uploads/123.jpg).
 */
export function imageUrl(path, baseUrl) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (baseUrl || API_BASE_URL).replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

/**
 * Normalize API product to UI shape (ProductCard / ProductDetail).
 * apiProduct: { images[], title, description, quantity, price, category?, seller: { firstName, lastName, shopName?, profilePic?, city? } }
 */
export function normalizeProduct(apiProduct, baseUrl) {
  if (!apiProduct) return null;
  const base = baseUrl || API_BASE_URL;
  const seller = apiProduct.seller || {};
  const sellerName =
    seller.shopName ||
    [seller.firstName, seller.lastName].filter(Boolean).join(' ').trim() ||
    'Seller';
  const sellerAvatar = seller.profilePic ? imageUrl(seller.profilePic, base) : null;
  const images = (apiProduct.images || []).map((p) => imageUrl(p, base));
  return {
    _id: apiProduct._id,
    id: apiProduct._id,
    image: images[0] || null,
    images,
    title: apiProduct.title || '',
    description: apiProduct.description || '',
    quantity: apiProduct.quantity ?? 0,
    price: apiProduct.price ?? 0,
    category: apiProduct.category || '',
    sellerName,
    sellerType: 'Seller',
    sellerAvatar,
    location: seller.city || '',
    seller: apiProduct.seller,
    sizes: Array.isArray(apiProduct.sizes) ? apiProduct.sizes : [],
    averageRating: apiProduct.averageRating || 0,
    reviewCount: apiProduct.reviewCount || 0,
  };
}

/**
 * GET /api/products or /api/products?sellerId=... or /api/products?bestSeller=true
 * @returns {Promise<Array>} normalized products
 */
export async function getProducts(sellerId, bestSeller) {
  const params = new URLSearchParams();
  if (sellerId) params.append('sellerId', sellerId);
  if (bestSeller) params.append('bestSeller', 'true');
  
  const url = params.toString()
    ? `${API_BASE_URL}/api/products?${params.toString()}`
    : `${API_BASE_URL}/api/products`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.message || 'Failed to load products');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to load products';
    throw err;
  }
  const list = Array.isArray(data) ? data : [];
  return list.map((p) => normalizeProduct(p));
}

/**
 * GET /api/products/:id
 * @returns {Promise<Object>} normalized product
 */
export async function getProductById(id) {
  const url = `${API_BASE_URL}/api/products/${encodeURIComponent(id)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.message || 'Product not found');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Product not found';
    throw err;
  }
  return normalizeProduct(data);
}

/**
 * POST /api/products with FormData (1-5 images, title, description, category, quantity, price).
 * Uses fetch so FormData works in React Native.
 * @param {string} token - JWT
 * @param {FormData} formData - keys: images (1-5 files), title, description, category, quantity, price
 */
export async function createProduct(token, formData) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const response = await fetch(`${API_BASE_URL}/api/products`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.message || 'Failed to create product');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to create product';
    throw err;
  }
  return normalizeProduct(data);
}

/**
 * Update an existing product
 * @param {string} productId - Product ID
 * @param {Object} productData - Product data to update
 * @param {string} token - JWT
 */
export async function updateProduct(productId, productData, token) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
    signal: controller.signal,
  });
  
  clearTimeout(timeoutId);
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.message || 'Failed to update product');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to update product';
    throw err;
  }
  return normalizeProduct(data);
}
