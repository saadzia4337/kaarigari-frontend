/**
 * Currency configuration
 * @format
 */

export const CURRENCY_CONFIG = {
  symbol: 'PKR',
  code: 'PKR',
  name: 'Pakistani Rupee',
  position: 'before', // 'before' or 'after'
  separator: ' ',
};

/**
 * Format price with currency
 * @param {number|string} price - The price value
 * @param {boolean} showSymbol - Whether to show currency symbol
 * @returns {string} Formatted price with currency
 */
export const formatPrice = (price, showSymbol = true) => {
  const numericPrice = parseFloat(price) || 0;
  const formattedPrice = numericPrice.toLocaleString();
  
  if (!showSymbol) {
    return formattedPrice;
  }
  
  if (CURRENCY_CONFIG.position === 'before') {
    return `${CURRENCY_CONFIG.symbol}${CURRENCY_CONFIG.separator}${formattedPrice}`;
  } else {
    return `${formattedPrice}${CURRENCY_CONFIG.separator}${CURRENCY_CONFIG.symbol}`;
  }
};

/**
 * Get currency symbol only
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = () => CURRENCY_CONFIG.symbol;

/**
 * Get currency code
 * @returns {string} Currency code
 */
export const getCurrencyCode = () => CURRENCY_CONFIG.code;
