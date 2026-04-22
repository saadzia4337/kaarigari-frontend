/**
 * Reviews API - fetch, create, update, delete reviews
 * Uses same base URL as auth for consistency
 * @format
 */

import { API_BASE_URL } from './authService';

const API_TIMEOUT_MS = 15000;

/**
 * Normalize API review to UI shape
 */
export function normalizeReview(apiReview, baseUrl) {
  if (!apiReview) return null;
  const base = baseUrl || API_BASE_URL;
  const user = apiReview.user || {};
  
  return {
    _id: apiReview._id,
    id: apiReview._id,
    rating: apiReview.rating || 0,
    comment: apiReview.comment || '',
    createdAt: apiReview.createdAt,
    updatedAt: apiReview.updatedAt,
    user: {
      _id: user._id,
      id: user._id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim(),
      profilePic: user.profilePic ? `${base}/${user.profilePic.replace(/^\//, '')}` : null,
    },
    product: apiReview.product,
  };
}

/**
 * GET /api/reviews/products/:productId/reviews
 * @param {string} productId - Product ID
 * @param {Object} options - Query options (page, limit, sort)
 * @returns {Promise<Object>} { reviews, pagination }
 */
export async function getProductReviews(productId, options = {}) {
  const { page = 1, limit = 10, sort = 'newest' } = options;
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
  });
  
  const url = `${API_BASE_URL}/api/reviews/products/${encodeURIComponent(productId)}/reviews?${params.toString()}`;
  
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
    const err = new Error(data.message || 'Failed to load reviews');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to load reviews';
    throw err;
  }
  
  return {
    reviews: (data.reviews || []).map(review => normalizeReview(review)),
    pagination: data.pagination || {
      currentPage: page,
      totalPages: 1,
      totalReviews: 0,
      hasNext: false,
      hasPrev: false,
    }
  };
}

/**
 * GET /api/reviews/products/:productId/reviews/stats
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Review statistics
 */
export async function getReviewStats(productId) {
  const url = `${API_BASE_URL}/api/reviews/products/${encodeURIComponent(productId)}/reviews/stats`;
  
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
    const err = new Error(data.message || 'Failed to load review statistics');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to load review statistics';
    throw err;
  }
  
  return data;
}

/**
 * GET /api/reviews/products/:productId/reviews/user
 * @param {string} productId - Product ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>} User's review for the product
 */
export async function getUserReview(productId, token) {
  const url = `${API_BASE_URL}/api/reviews/products/${encodeURIComponent(productId)}/reviews/user`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  
  const response = await fetch(url, {
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
    if (response.status === 404) {
      return null; // User hasn't reviewed this product yet
    }
    const err = new Error(data.message || 'Failed to load your review');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to load your review';
    throw err;
  }
  
  return normalizeReview(data);
}

/**
 * POST /api/reviews/products/:productId/reviews
 * @param {string} productId - Product ID
 * @param {Object} reviewData - { rating, comment }
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Created review
 */
export async function createReview(productId, reviewData, token) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  
  const response = await fetch(`${API_BASE_URL}/api/reviews/products/${encodeURIComponent(productId)}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reviewData),
    signal: controller.signal,
  });
  
  clearTimeout(timeoutId);
  const data = await response.json();
  
  if (!response.ok) {
    const err = new Error(data.message || 'Failed to create review');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to create review';
    throw err;
  }
  
  return normalizeReview(data);
}

/**
 * PUT /api/reviews/:id
 * @param {string} reviewId - Review ID
 * @param {Object} reviewData - { rating, comment }
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Updated review
 */
export async function updateReview(reviewId, reviewData, token) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  
  const response = await fetch(`${API_BASE_URL}/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reviewData),
    signal: controller.signal,
  });
  
  clearTimeout(timeoutId);
  const data = await response.json();
  
  if (!response.ok) {
    const err = new Error(data.message || 'Failed to update review');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to update review';
    throw err;
  }
  
  return normalizeReview(data);
}

/**
 * DELETE /api/reviews/:id
 * @param {string} reviewId - Review ID
 * @param {string} token - JWT token
 * @returns {Promise<void>}
 */
export async function deleteReview(reviewId, token) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  
  const response = await fetch(`${API_BASE_URL}/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  });
  
  clearTimeout(timeoutId);
  
  if (!response.ok) {
    const data = await response.json();
    const err = new Error(data.message || 'Failed to delete review');
    err.response = { status: response.status, data };
    err.userMessage = data.message || 'Failed to delete review';
    throw err;
  }
}
