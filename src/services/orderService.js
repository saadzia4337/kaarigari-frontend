import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_HOST_OVERRIDE } from '../config/api';

const API_PORT = '5000';
// Android emulator: 10.0.2.2. Physical device: set API_HOST_OVERRIDE in src/config/api.js to your PC IP.
const androidHost = API_HOST_OVERRIDE || '10.0.2.2';
const API_BASE_URL = Platform.OS === 'android'
  ? `http://${androidHost}:${API_PORT}`
  : `http://localhost:${API_PORT}`;

const API_URL = `${API_BASE_URL}/api`;

// Get auth token
const getAuthToken = async () => {
  try {
    // Try the correct key first
    let token = await AsyncStorage.getItem('@auth_token');
    
    // Fallback to old key if needed
    if (!token) {
      token = await AsyncStorage.getItem('token');
      console.log('Token from AsyncStorage (fallback - token):', token ? 'exists' : 'not found');
    } else {
      console.log('Token from AsyncStorage (@auth_token):', token ? 'exists' : 'not found');
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Create axios instance with auth
const createApiInstance = async () => {
  const token = await getAuthToken();
  console.log('Creating API instance with token:', token ? 'yes' : 'no');
  console.log('API URL:', API_URL);
  
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  
  // Add request interceptor for debugging
  instance.interceptors.request.use(request => {
    console.log('Order Service Request:', {
      url: request.url,
      method: request.method,
      headers: request.headers,
      hasAuth: !!request.headers.Authorization
    });
    return request;
  });
  
  return instance;
};

// Get orders where authenticated user is the buyer (for seller purchases)
export const getMyPurchases = async (page = 1, limit = 10, status = null) => {
  try {
    const api = await createApiInstance();
    const params = { page, limit };
    if (status) params.status = status;
    
    console.log('Fetching my purchases with params:', params);
    const response = await api.get('/orders/my-purchases', { params });
    console.log('My purchases fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get my purchases error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: error.config
    });
    throw error.response?.data?.message || 'Failed to fetch purchases';
  }
};

// Get all orders (admin) or user's orders
export const getOrders = async (page = 1, limit = 10, status = null) => {
  try {
    const api = await createApiInstance();
    const params = { page, limit };
    if (status) params.status = status;
    
    console.log('Fetching orders with params:', params);
    const response = await api.get('/orders', { params });
    console.log('Orders fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get orders error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: error.config
    });
    throw error.response?.data?.message || 'Failed to fetch orders';
  }
};

// Get single order by ID
export const getOrderById = async (orderId) => {
  try {
    const api = await createApiInstance();
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Get order error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to fetch order';
  }
};

// Test API connectivity
export const testApiConnection = async () => {
  try {
    const response = await axios.get(`${API_URL}/hello`);
    console.log('API connection test successful:', response.data);
    return true;
  } catch (error) {
    console.error('API connection test failed:', error.message);
    return false;
  }
};

// Create new order
export const createOrder = async (orderData) => {
  try {
    // Test API connection first
    const isConnected = await testApiConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to API server');
    }
    
    const api = await createApiInstance();
    console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
    const response = await api.post('/orders', orderData);
    console.log('Order created successfully:', response.data);
    
    // Send alert to seller when buyer places order
    if (response.data._id && response.data.items && response.data.items.length > 0) {
      const sellerId = response.data.items[0].seller;
      const buyerId = response.data.user;
      
      await sendOrderAlert(
        response.data._id, 
        `New order #${response.data.orderNumber || response.data._id} placed successfully`, 
        'order_placed', 
        buyerId, 
        sellerId
      );
    }
    
    return response.data;
  } catch (error) {
    console.error('Create order error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      throw 'Please login to place an order';
    }
    throw error.response?.data?.message || 'Failed to create order';
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (orderId, status, notes) => {
  try {
    const api = await createApiInstance();
    const response = await api.put(`/orders/${orderId}/status`, { status, notes });
    
    // Send alert to buyer when seller updates status
    if (response.data._id && response.data.user && response.data.items && response.data.items.length > 0) {
      const sellerId = response.data.items[0].seller;
      const buyerId = response.data.user;
      const oldStatus = response.data.status || 'unknown';
      
      await sendStatusUpdateAlert(orderId, oldStatus, status, sellerId, buyerId);
    }
    
    return response.data;
  } catch (error) {
    console.error('Update order status error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to update order status';
  }
};

// Update order status (seller only - now uses main endpoint)
export const updateSellerOrderStatus = async (orderId, status, notes) => {
  try {
    const api = await createApiInstance();
    const response = await api.put(`/orders/${orderId}/status`, { status, notes });
    
    // Send alert to buyer when seller updates status
    if (response.data._id && response.data.user && response.data.items && response.data.items.length > 0) {
      const sellerId = response.data.items[0].seller;
      const buyerId = response.data.user;
      const oldStatus = response.data.status || 'unknown';
      
      await sendStatusUpdateAlert(orderId, oldStatus, status, sellerId, buyerId);
    }
    
    return response.data;
  } catch (error) {
    console.error('Update seller order status error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to update order status';
  }
};

// Cancel order (user only)
export const cancelOrder = async (orderId, reason) => {
  try {
    const api = await createApiInstance();
    const response = await api.put(`/orders/${orderId}/status`, { status: 'cancelled', notes: reason });
    
    // Send alert to seller when buyer cancels order
    if (response.data._id && response.data.user && response.data.items && response.data.items.length > 0) {
      const sellerId = response.data.items[0].seller;
      const buyerId = response.data.user;
      
      await sendOrderAlert(
        orderId, 
        `Order cancelled: ${reason}`, 
        'order_cancelled', 
        buyerId, 
        sellerId
      );
    }
    
    return response.data;
  } catch (error) {
    console.error('Cancel order error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to cancel order';
  }
};

// Get orders for a specific seller
export const getSellerOrders = async (sellerId, page = 1, limit = 10, status = null) => {
  try {
    const api = await createApiInstance();
    const params = { page, limit };
    if (status) params.status = status;
    
    console.log(`Fetching orders for seller ${sellerId} with params:`, params);
    const response = await api.get(`/orders/seller/${sellerId}`, { params });
    console.log('Seller orders fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get seller orders error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: error.config
    });
    throw error.response?.data?.message || 'Failed to fetch seller orders';
  }
};

// Get order statistics (admin only)
export const getOrderStats = async () => {
  try {
    const api = await createApiInstance();
    const response = await api.get('/orders/stats/summary');
    return response.data;
  } catch (error) {
    console.error('Get order stats error:', error.response?.data || error.message);
    throw error.response?.data?.message || 'Failed to fetch order statistics';
  }
};

// Helper function to format order data from cart
export const formatOrderData = (cartItems, shippingAddress, notes = '') => {
  const items = cartItems.map(item => ({
    productId: item.product._id,
    quantity: item.qty,
    price: item.product.price,
    size: item.size || null
  }));

  return {
    items,
    shippingAddress: {
      fullName: shippingAddress.fullName,
      phone: shippingAddress.phone,
      address: shippingAddress.address,
      area: shippingAddress.area,
      city: shippingAddress.city,
      postalCode: shippingAddress.postalCode || ''
    },
    notes
  };
};

// Format order status for display
export const formatOrderStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return statusMap[status] || status;
};

// Get status color for UI
export const getStatusColor = (status) => {
  const colorMap = {
    pending: '#FFA500',      // Orange
    confirmed: '#007AFF',    // Blue
    processing: '#5856D6',  // Purple
    shipped: '#34C759',     // Green
    delivered: '#30D158',   // Bright Green
    cancelled: '#FF3B30'     // Red
  };
  return colorMap[status] || '#8E8E93';
};

// Calculate order total
export const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => {
    return total + (item.product.price * item.qty);
  }, 0);
};

// Format price display
export const formatPrice = (price) => {
  const numericPrice = parseFloat(price) || 0;
  const formattedPrice = numericPrice.toLocaleString();
  return `PKR ${formattedPrice}`;
};

// Format order date
export const formatOrderDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Alert functions for order notifications
export const sendOrderAlert = async (orderId, message, type, senderId, recipientId) => {
  try {
    const api = await createApiInstance();
    console.log('Sending order alert to URL:', api.defaults.baseURL + '/alerts');
    const response = await api.post('/alerts', {
      orderId,
      message,
      type,
      senderId,
      recipientId
    });
    console.log('Order alert sent:', { orderId, message, type, senderId, recipientId, response });
  } catch (error) {
    console.error('Failed to send order alert:', error);
    console.error('Error details:', error.response?.status, error.response?.data);
  }
};

export const sendStatusUpdateAlert = async (orderId, oldStatus, newStatus, senderId, recipientId) => {
  try {
    const api = await createApiInstance();
    console.log('Sending status update alert to URL:', api.defaults.baseURL + '/alerts');
    const response = await api.post('/alerts', {
      orderId,
      message: `Order status updated from ${oldStatus} to ${newStatus}`,
      type: 'status_update',
      senderId,
      recipientId
    });
    console.log('Status update alert sent:', { orderId, oldStatus, newStatus, senderId, recipientId, response });
  } catch (error) {
    console.error('Failed to send status update alert:', error);
    console.error('Error details:', error.response?.status, error.response?.data);
  }
};

// Mark alert as read function
export const markAlertAsRead = async (alertId) => {
  try {
    const api = await createApiInstance();
    console.log('Marking alert as read:', alertId);
    const response = await api.put(`/alerts/${alertId}/read`);
    console.log('Alert marked as read successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to mark alert as read:', error);
    console.error('Error details:', error.response?.status, error.response?.data);
    throw error.response?.data?.error || 'Failed to mark alert as read';
  }
};

// Get unread alert count function
export const getUnreadAlertCount = async () => {
  try {
    const api = await createApiInstance();
    console.log('Fetching unread alert count...');
    const response = await api.get('/alerts/count');
    console.log('API Response:', response);
    console.log('Response data:', response.data);
    console.log('Response success:', response.data?.success);
    console.log('Unread alert count from response.data:', response.data?.data);
    console.log('Direct response data:', response.data);
    
    // Handle different response structures
    const count = response.data?.data !== undefined ? response.data.data : response.data;
    console.log('Final count extracted:', count);
    return count;
  } catch (error) {
    console.error('Failed to fetch unread alert count:', error);
    console.error('Error details:', error.response?.status, error.response?.data);
    throw error.response?.data?.error || 'Failed to fetch unread alert count';
  }
};

// Delete alert function
export const deleteAlert = async (alertId) => {
  try {
    const api = await createApiInstance();
    console.log('Deleting alert with ID:', alertId);
    const response = await api.delete(`/alerts/${alertId}`);
    console.log('Alert deleted successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to delete alert:', error);
    console.error('Error details:', error.response?.status, error.response?.data);
    throw error.response?.data?.error || 'Failed to delete alert';
  }
};

// Export createApiInstance for use in other components
export { createApiInstance };
