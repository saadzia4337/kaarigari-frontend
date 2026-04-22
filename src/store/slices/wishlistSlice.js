import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as wishlistApi from '../../services/wishlistService';
import { logoutAsync } from './authSlice';

/**
 * Fetch wishlist from API for logged-in user. Clears when not logged in.
 */
export const fetchWishlistAsync = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return [];
    try {
      return await wishlistApi.getWishlist(token);
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to load wishlist');
    }
  }
);

/**
 * Add product to wishlist via API. Requires login.
 */
export const addToWishlistAsync = createAsyncThunk(
  'wishlist/addToWishlist',
  async ({ product }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Please login to add to wishlist');
    const productId = product._id || product.id;
    if (!productId) return rejectWithValue('Invalid product');
    try {
      return await wishlistApi.addWishlistItem(token, productId);
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to add to wishlist');
    }
  }
);

/**
 * Remove product from wishlist via API.
 */
export const removeFromWishlistAsync = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    try {
      return await wishlistApi.removeWishlistItem(token, productId);
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to remove from wishlist');
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [], // array of normalized products
    error: null,
  },
  reducers: {
    clearWishlistError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlistAsync.fulfilled, (state, action) => {
        state.items = action.payload || [];
        state.error = null;
      })
      .addCase(fetchWishlistAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(addToWishlistAsync.fulfilled, (state, action) => {
        state.items = action.payload || [];
        state.error = null;
      })
      .addCase(addToWishlistAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(removeFromWishlistAsync.fulfilled, (state, action) => {
        state.items = action.payload || [];
        state.error = null;
      })
      .addCase(removeFromWishlistAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.items = [];
        state.error = null;
      });
  },
});

export const { clearWishlistError } = wishlistSlice.actions;
export default wishlistSlice.reducer;

export const selectWishlistItems = (state) => state.wishlist.items;
export const selectWishlistCount = (state) => state.wishlist.items.length;
export const selectIsInWishlist = (state, productId) =>
  state.wishlist.items.some(
    (p) => (p._id || p.id) === productId
  );
