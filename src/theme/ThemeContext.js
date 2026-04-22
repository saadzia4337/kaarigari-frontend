/**
 * Theme context - light theme by default (dynamic colors)
 * @format
 */

import React, { createContext, useContext } from 'react';
import { lightColors } from './colors';

const ThemeContext = createContext(lightColors);

export function ThemeProvider({ children }) {
  // Use light theme by default; theme object remains dynamic for future toggle
  const theme = lightColors;

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
