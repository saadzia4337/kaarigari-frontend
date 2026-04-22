/**
 * Socket.IO service for real-time messaging
 * @format
 */

import { io } from 'socket.io-client';
import { API_BASE_URL } from './authService';

let socket = null;
let currentUserId = null;

/**
 * Initialize Socket.IO connection
 * @param {string} token - JWT token
 * @param {string} userId - Current user ID
 */
export const initializeSocket = (token, userId) => {
  if (socket) {
    socket.disconnect();
  }

  currentUserId = userId;
  
  console.log('=== SOCKET INITIALIZATION ===');
  console.log('User ID being passed:', userId);
  console.log('Token exists:', !!token);
  
  socket = io(API_BASE_URL, {
    auth: {
      token: token
    },
    transports: ['websocket'],
    forceNew: true
  });

  socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
    if (currentUserId) {
      socket.emit('user:join', currentUserId);
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

/**
 * Get current socket instance
 */
export const getSocket = () => socket;

/**
 * Send message via Socket.IO
 * @param {Object} messageData - Message data
 */
export const sendMessageViaSocket = (messageData) => {
  if (socket && socket.connected) {
    socket.emit('message:send', messageData);
  }
};

/**
 * Join user room
 * @param {string} userId - User ID
 */
export const joinUserRoom = (userId) => {
  if (socket && socket.connected) {
    socket.emit('user:join', userId);
  }
};

/**
 * Start typing indicator
 * @param {string} receiverId - Receiver's user ID
 */
export const startTyping = (receiverId) => {
  if (socket && socket.connected) {
    socket.emit('typing:start', receiverId);
  }
};

/**
 * Stop typing indicator
 * @param {string} receiverId - Receiver's user ID
 */
export const stopTyping = (receiverId) => {
  if (socket && socket.connected) {
    socket.emit('typing:stop', receiverId);
  }
};

/**
 * Mark message as read
 * @param {string} messageId - Message ID
 * @param {string} senderId - Sender's user ID
 */
export const markMessageAsRead = (messageId, senderId) => {
  if (socket && socket.connected) {
    socket.emit('message:read', { messageId, senderId });
  }
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Socket event listeners setup
 */
export const setupSocketListeners = (callbacks) => {
  if (!socket) return;

  // Listen for incoming messages
  socket.on('message:receive', (message) => {
    console.log('=== SOCKET MESSAGE RECEIVED ===');
    console.log('Message received via socket:', message);
    console.log('Message content:', message.content);
    console.log('Sender:', message.sender?.firstName + ' ' + message.sender?.lastName);
    console.log('==============================');
    
    if (callbacks.onMessageReceived) {
      callbacks.onMessageReceived(message);
    }
  });

  // Listen for message sent confirmation
  socket.on('message:sent', (message) => {
    if (callbacks.onMessageSent) {
      callbacks.onMessageSent(message);
    }
  });

  // Listen for read receipts
  socket.on('message:read', (data) => {
    if (callbacks.onMessageRead) {
      callbacks.onMessageRead(data);
    }
  });

  // Listen for online status
  socket.on('user:online', (data) => {
    if (callbacks.onUserOnline) {
      callbacks.onUserOnline(data);
    }
  });

  // Listen for offline status
  socket.on('user:offline', (data) => {
    if (callbacks.onUserOffline) {
      callbacks.onUserOffline(data);
    }
  });

  // Listen for typing indicators
  socket.on('user:typing', (data) => {
    if (callbacks.onUserTyping) {
      callbacks.onUserTyping(data);
    }
  });

  // Listen for errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    if (callbacks.onError) {
      callbacks.onError(error);
    }
  });
};
