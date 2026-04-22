import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as settingsApi from '../../services/settingsService';

export const fetchPrimaryBanner = createAsyncThunk(
  'banners/fetchPrimary',
  async (_, { rejectWithValue }) => {
    try {
      return await settingsApi.getPrimaryBanner();
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to load primary banner');
    }
  }
);

export const fetchSecondaryBanner = createAsyncThunk(
  'banners/fetchSecondary',
  async (_, { rejectWithValue }) => {
    try {
      return await settingsApi.getSecondaryBanner();
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to load secondary banner');
    }
  }
);

export const updatePrimaryBannerAsync = createAsyncThunk(
  'banners/updatePrimary',
  async (formData, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    try {
      return await settingsApi.updatePrimaryBanner(token, formData);
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to update primary banner');
    }
  }
);

export const updateSecondaryBannerAsync = createAsyncThunk(
  'banners/updateSecondary',
  async (formData, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    try {
      return await settingsApi.updateSecondaryBanner(token, formData);
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to update secondary banner');
    }
  }
);

const bannersSlice = createSlice({
  name: 'banners',
  initialState: {
    primarySlides: [],
    secondaryBanner: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrimaryBanner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrimaryBanner.fulfilled, (state, action) => {
        state.loading = false;
        state.primarySlides = action.payload?.slides ?? [];
        state.error = null;
      })
      .addCase(fetchPrimaryBanner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to load primary banner';
      })
      .addCase(fetchSecondaryBanner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSecondaryBanner.fulfilled, (state, action) => {
        state.loading = false;
        state.secondaryBanner = action.payload ?? null;
        state.error = null;
      })
      .addCase(fetchSecondaryBanner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to load secondary banner';
      })
      .addCase(updatePrimaryBannerAsync.fulfilled, (state, action) => {
        state.primarySlides = action.payload?.slides ?? [];
      })
      .addCase(updateSecondaryBannerAsync.fulfilled, (state, action) => {
        state.secondaryBanner = action.payload ?? null;
      });
  },
});

export const selectPrimarySlides = (state) => state.banners.primarySlides;
export const selectSecondaryBanner = (state) => state.banners.secondaryBanner;
export const selectBannersLoading = (state) => state.banners.loading;
export const selectBannersError = (state) => state.banners.error;

export default bannersSlice.reducer;
