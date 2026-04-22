import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  alerts: [],
  unreadCount: 0,
};

const alertSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setAlerts: (state, action) => {
      state.alerts = action.payload;
      // Calculate unread count
      state.unreadCount = action.payload.filter(alert => !alert.read).length;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    markAsRead: (state, action) => {
      const alertId = action.payload;
      state.alerts = state.alerts.map(alert =>
        alert._id === alertId ? { ...alert, read: true } : alert
      );
      // Recalculate unread count
      state.unreadCount = state.alerts.filter(alert => !alert.read).length;
    },
    deleteAlert: (state, action) => {
      const alertId = action.payload;
      state.alerts = state.alerts.filter(alert => alert._id !== alertId);
      // Recalculate unread count
      state.unreadCount = state.alerts.filter(alert => !alert.read).length;
    },
    clearAlerts: (state) => {
      state.alerts = [];
      state.unreadCount = 0;
    },
  },
});

export const { setAlerts, setUnreadCount, markAsRead, deleteAlert, clearAlerts } = alertSlice.actions;

// Selectors
export const selectUnreadAlertCount = (state) => state.alerts.unreadCount;
export const selectAllAlerts = (state) => state.alerts.alerts;

export default alertSlice.reducer;
