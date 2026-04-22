import { createSlice } from '@reduxjs/toolkit';

const toastSlice = createSlice({
  name: 'toast',
  initialState: {
    visible: false,
    message: '',
    type: 'info',
  },
  reducers: {
    showToast: (state, action) => {
      state.visible = true;
      if (typeof action.payload === 'string') {
        state.message = action.payload;
        state.type = 'info';
      } else {
        state.message = action.payload?.message || '';
        state.type = action.payload?.type || 'info';
      }
    },
    hideToast: (state) => {
      state.visible = false;
      state.message = '';
      state.type = 'info';
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice.reducer;
