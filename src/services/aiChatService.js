import { API_BASE_URL } from './authService';

const API_TIMEOUT_MS = 30000;

/**
 * Send message to AI chat
 * @param {string} token - Auth token
 * @param {string} message - User message
 * @returns {Promise<Object>} AI response
 */
export async function sendAIMessage(token, message) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai-chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!response.ok) {
      const err = new Error(data.message || 'Failed to send message');
      err.response = { status: response.status, data };
      err.userMessage = data.message || 'Failed to send message';
      throw err;
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      const err = new Error('Request timeout');
      err.userMessage = 'Request timeout. Please try again.';
      throw err;
    }
    
    throw error;
  }
}

/**
 * Send message with image to AI chat
 * @param {string} token - Auth token
 * @param {string} message - User message (optional)
 * @param {Object} imageFile - Image file object
 * @returns {Promise<Object>} AI response
 */
export async function sendAIMessageWithImage(token, message, imageFile) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  
  try {
    const formData = new FormData();
    
    // Add message if provided
    if (message) {
      formData.append('message', message);
    }
    
    // Add image if provided
    if (imageFile) {
      formData.append('image', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'chat-image.jpg',
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/api/ai-chat/message`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!response.ok) {
      const err = new Error(data.message || 'Failed to send message');
      err.response = { status: response.status, data };
      err.userMessage = data.message || 'Failed to send message';
      throw err;
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      const err = new Error('Request timeout');
      err.userMessage = 'Request timeout. Please try again.';
      throw err;
    }
    
    throw error;
  }
}

/**
 * Get chat history (for future implementation)
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Chat history
 */
export async function getChatHistory(token) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai-chat/history`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!response.ok) {
      const err = new Error(data.message || 'Failed to fetch chat history');
      err.response = { status: response.status, data };
      err.userMessage = data.message || 'Failed to fetch chat history';
      throw err;
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Generate fashion image using DALL-E
 * @param {string} token - Auth token
 * @param {string} prompt - Image generation prompt
 * @returns {Promise<Object>} Generated image data
 */
export async function generateFashionImage(token, prompt) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai-chat/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (!response.ok) {
      const err = new Error(data.message || 'Failed to generate image');
      err.response = { status: response.status, data };
      err.userMessage = data.message || 'Failed to generate image';
      throw err;
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      const err = new Error('Request timeout');
      err.userMessage = 'Image generation timeout. Please try again.';
      throw err;
    }
    
    throw error;
  }
}

/**
 * Get suggested questions for users
 * @returns {Array<string>} Array of suggested questions
 */
export function getSuggestedQuestions() {
  return [
    "What colors go well with navy blue?",
    "Which dress style suits my body type?",
    "How to measure for custom tailoring?",
    "Best fabrics for summer clothing?",
    "Traditional vs modern design ideas",
    "Color combinations for wedding outfits",
    "Generate a modern dress design",
    "Create a traditional outfit idea"
  ];
}
