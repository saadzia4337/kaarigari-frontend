import { API_BASE_URL } from './authService';

/**
 * Get Stripe configuration (publishable key)
 * @returns {Promise<Object>} Stripe config
 */
export const getStripeConfig = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stripe/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to get Stripe configuration');
    }

    return data;
  } catch (error) {
    console.error('Get Stripe config error:', error);
    throw error;
  }
};

/**
 * Create a payment intent for order
 * @param {string} token - Auth token
 * @param {number} amount - Amount in currency units (e.g., 29.99)
 * @param {string} orderId - Order ID
 * @param {string} currency - Currency code (default: 'pkr')
 * @returns {Promise<Object>} Payment intent with client secret
 */
export const createPaymentIntent = async (token, amount, orderId, currency = 'pkr') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stripe/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        orderId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create payment intent');
    }

    return data;
  } catch (error) {
    console.error('Create payment intent error:', error);
    throw error;
  }
};

/**
 * Confirm payment status
 * @param {string} token - Auth token
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Object>} Payment status
 */
export const confirmPayment = async (token, paymentIntentId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stripe/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        paymentIntentId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to confirm payment');
    }

    return data;
  } catch (error) {
    console.error('Confirm payment error:', error);
    throw error;
  }
};

/**
 * Create a refund for payment
 * @param {string} token - Auth token
 * @param {string} paymentIntentId - Payment intent ID
 * @param {number} amount - Amount to refund in currency units (optional)
 * @returns {Promise<Object>} Refund details
 */
export const createRefund = async (token, paymentIntentId, amount) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stripe/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        paymentIntentId,
        amount,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create refund');
    }

    return data;
  } catch (error) {
    console.error('Create refund error:', error);
    throw error;
  }
};

/**
 * Format amount for display
 * @param {number} amount - Amount in cents
 * @param {string} currency - Currency code
 * @returns {string} Formatted amount
 */
export const formatAmount = (amount, currency = 'PKR') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

/**
 * Convert currency amount to cents for Stripe
 * @param {number} amount - Amount in currency units
 * @returns {number} Amount in cents
 */
export const toCents = (amount) => {
  return Math.round(amount * 100);
};

/**
 * Convert cents to currency amount
 * @param {number} cents - Amount in cents
 * @returns {number} Amount in currency units
 */
export const fromCents = (cents) => {
  return cents / 100;
};
