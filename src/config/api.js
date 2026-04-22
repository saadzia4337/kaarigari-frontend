/**
 * API server address for the app.
 *
 * - null = use 10.0.2.2 (Android emulator only).
 * - Your PC's IP = use when on physical device (or if emulator can't reach 10.0.2.2).
 *   Phone and PC must be on the same WiFi. Run "ipconfig" to get IPv4.
 */
export const API_HOST_OVERRIDE = '192.168.100.117';

/**
 * API configuration for different environments
 */
export const API_CONFIG = {
  BASE_URL: API_HOST_OVERRIDE 
    ? `http://${API_HOST_OVERRIDE}:5000` 
    : `http://localhost:5000`,
  IMAGE_BASE_URL: API_HOST_OVERRIDE 
    ? `http://${API_HOST_OVERRIDE}:5000` 
    : 'http://10.0.2.2:5000',
  PORT: 5000
};

/**
 * Get full image URL from relative path
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${API_CONFIG.IMAGE_BASE_URL}/${cleanPath}`;
};
