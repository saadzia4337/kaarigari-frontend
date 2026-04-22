import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as cartApi from '../../services/cartService';
import { logoutAsync } from './authSlice';

/**
 * Fetch cart from API for logged-in user. Clears cart when not logged in.
 */
export const fetchCartAsync = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return [];
    try {
      return await cartApi.getCart(token);
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to load cart');
    }
  }
);

/**
 * Add item to cart via API. Requires login. Payload: { product, qty = 1, size (optional), customSize (optional) }
 */
export const addToCartAsync = createAsyncThunk(
  'cart/addToCart',
  async ({ product, qty = 1, size, customSize }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Please login to add to cart');
    const productId = product._id || product.id;
    if (!productId) return rejectWithValue('Invalid product');
    try {
      return await cartApi.addCartItem(token, productId, qty, size, customSize);
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to add to cart');
    }
  }
);

/**
 * Remove item from cart via API. Arg: productId (string) or { productId, size }.
 */
export const removeFromCartAsync = createAsyncThunk(
  'cart/removeFromCart',
  async (arg, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    const productId = typeof arg === 'object' && arg?.productId != null ? arg.productId : arg;
    const size = typeof arg === 'object' && arg?.size !== undefined ? arg.size : undefined;
    try {
      return await cartApi.removeCartItem(token, productId, size);
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to remove from cart');
    }
  }
);

/**
 * Update item qty via API. Payload: { productId, qty, size (optional) }
 */
export const updateCartQtyAsync = createAsyncThunk(
  'cart/updateCartQty',
  async ({ productId, qty, size }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    try {
      return await cartApi.updateCartItemQty(token, productId, qty, size);
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to update cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.error = null;
    },
    clearCartError: (state) => {
      state.error = null;
    },
    removeOrderedItems: (state, action) => {
      const orderedItems = action.payload;
      state.items = state.items.filter(cartItem => {
        return !orderedItems.some(orderedItem => 
          orderedItem.product._id === cartItem.product._id && 
          orderedItem.size === cartItem.size
        );
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCart
      .addCase(fetchCartAsync.fulfilled, (state, action) => {
        state.items = action.payload || [];
        state.error = null;
      })
      .addCase(fetchCartAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      // addToCart
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        state.items = action.payload || [];
        state.error = null;
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      // removeFromCart
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        state.items = action.payload || [];
        state.error = null;
      })
      .addCase(removeFromCartAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      // updateCartQty
      .addCase(updateCartQtyAsync.fulfilled, (state, action) => {
        state.items = action.payload || [];
        state.error = null;
      })
      .addCase(updateCartQtyAsync.rejected, (state, action) => {
        state.error = action.payload;
      })
      // clear cart when user logs out
      .addCase(logoutAsync.fulfilled, (state) => {
        state.items = [];
        state.error = null;
      });
  },
});

export const { clearCart, clearCartError, removeOrderedItems } = cartSlice.actions;
export default cartSlice.reducer;

export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, it) => sum + (it.qty || 1), 0);
export const selectCartError = (state) => state.cart.error;
export const selectCartLoading = (state) => state.cart.loading;
