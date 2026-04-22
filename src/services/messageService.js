/**
 * Message/Chat service for seller-buyer communication
 * @format
 */

import { API_BASE_URL } from './authService';

const API_TIMEOUT_MS = 15000;

/**
 * Normalize message from API response
 */
function normalizeMessage(apiMessage) {
  return {
    id: apiMessage._id,
    text: apiMessage.content,
    content: apiMessage.content, // Add content field for consistency
    time: new Date(apiMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: apiMessage.createdAt,
    senderName: apiMessage.sender?.firstName + ' ' + apiMessage.sender?.lastName,
    sender: apiMessage.sender,
    receiver: apiMessage.receiver,
    read: apiMessage.read,
    readAt: apiMessage.readAt
  };
}

/**
 * Normalize conversation from API response
 */
function normalizeConversation(apiConversation) {
  return {
    id: apiConversation.id,
    seller: {
      id: apiConversation.partner._id,
      name: apiConversation.partner.firstName + ' ' + apiConversation.partner.lastName,
      avatar: apiConversation.partner.profilePic
    },
    lastMessage: apiConversation.lastMessage.content,
    timestamp: apiConversation.lastMessage.createdAt,
    unreadCount: apiConversation.unreadCount || 0
  };
}

/**
 * Get messages between current user and a seller
 * @param {string} token - JWT token
 * @param {string} sellerId - Seller's user ID
 * @returns {Promise<Array>} Array of messages
 */
export async function getMessages(token, sellerId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/messages/${sellerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to load messages');
    }

    const data = await response.json();
    return data.map(msg => normalizeMessage(msg));
  } catch (error) {
    console.error('Get messages error:', error);
    throw error;
  }
}

/**
 * Send a message to a seller
 * @param {string} token - JWT token
 * @param {string} sellerId - Seller's user ID
 * @param {string} messageText - Message content
 * @returns {Promise<Object>} Sent message object
 */
export async function sendMessage(token, sellerId, messageText) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receiverId: sellerId,
        content: messageText,
        messageType: 'text'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send message');
    }

    const data = await response.json();
    return normalizeMessage(data);
  } catch (error) {
    console.error('Send message error:', error);
    throw error;
  }
}

/**
 * Get all conversations for the current user
 * @param {string} token - JWT token
 * @returns {Promise<Array>} Array of conversations
 */
export async function getConversations(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to load conversations');
    }

    const data = await response.json();
    return data.map(conv => normalizeConversation(conv));
  } catch (error) {
    console.error('Get conversations error:', error);
    throw error;
  }
}

export const getUnreadCount = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/messages/unread/count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get unread count');
    }
    return data.count;
  } catch (error) {
    console.error('Get unread count error:', error);
    throw error;
  }
};

export const deleteMessage = async (token, messageId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete message');
    }
    return data;
  } catch (error) {
    console.error('Delete message error:', error);
    throw error;
  }
};

export const deleteMessages = async (token, messageIds) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/messages/bulk`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageIds }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete messages');
    }
    return data;
  } catch (error) {
    console.error('Delete messages error:', error);
    throw error;
  }
};

export const markMessagesAsRead = async (token, sellerId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/messages/read/${sellerId}/all`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to mark messages as read');
    }
    return data;
  } catch (error) {
    console.error('Mark as read error:', error);
    throw error;
  }
};
