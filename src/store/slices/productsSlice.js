import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getProducts as getProductsApi,
  getProductById as getProductByIdApi,
  createProduct as createProductApi,
  updateProduct as updateProductApi,
  deleteProduct as deleteProductApi,
} from '../../services/productService';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (payload, { rejectWithValue }) => {
    const sellerId = payload?.sellerId;
    const bestSeller = payload?.bestSeller;
    try {
      return await getProductsApi(sellerId, bestSeller);
    } catch (err) {
      return rejectWithValue(
        err.userMessage || err.response?.data?.message || err.message || 'Failed to load products'
      );
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id, { rejectWithValue }) => {
    try {
      return await getProductByIdApi(id);
    } catch (err) {
      return rejectWithValue(
        err.userMessage || err.response?.data?.message || err.message || 'Failed to load product'
      );
    }
  }
);

export const createProductAsync = createAsyncThunk(
  'products/create',
  async (formData, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    try {
      const response = await createProductApi(token, formData);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.userMessage || err.message || 'Failed to create product'
      );
    }
  }
);

export const updateProductAsync = createAsyncThunk(
  'products/update',
  async ({ productId, productData }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    try {
      const response = await updateProductApi(productId, productData, token);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.userMessage || err.message || 'Failed to update product'
      );
    }
  }
);

export const deleteProductAsync = createAsyncThunk(
  'products/delete',
  async (productId, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    try {
      await deleteProductApi(productId, token);
      return productId;
    } catch (err) {
      return rejectWithValue(
        err.userMessage || err.message || 'Failed to delete product'
      );
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    list: [],
    currentProduct: null,
    loading: false,
    createLoading: false,
    error: null,
  },
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearProductsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload || [];
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to load products';
      })
      // fetchProductById
      .addCase(fetchProductById.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.currentProduct = action.payload ?? null;
        state.error = null;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.currentProduct = null;
        state.error = action.payload ?? 'Failed to load product';
      })
      // createProductAsync
      .addCase(createProductAsync.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createProductAsync.fulfilled, (state, action) => {
        state.createLoading = false;
        if (action.payload) {
          state.list = [action.payload, ...state.list];
        }
        state.error = null;
      })
      .addCase(createProductAsync.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload ?? 'Failed to create product';
      })
      // updateProductAsync
      .addCase(updateProductAsync.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(updateProductAsync.fulfilled, (state, action) => {
        state.createLoading = false;
        if (action.payload) {
          // Update the product in the list
          state.list = state.list.map(product =>
            product._id === action.payload._id ? action.payload : product
          );
        }
        state.error = null;
      })
      .addCase(updateProductAsync.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload ?? 'Failed to update product';
      })
      // deleteProductAsync
      .addCase(deleteProductAsync.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(deleteProductAsync.fulfilled, (state, action) => {
        state.createLoading = false;
        // Remove product from list
        state.list = state.list.filter(product => product._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteProductAsync.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload ?? 'Failed to delete product';
      });
  },
});

export const { clearCurrentProduct, clearProductsError } = productsSlice.actions;

// Selectors
export const selectAllProducts = (state) => state.products?.list || [];
export const selectProductsLoading = (state) => state.products?.loading || false;
export const selectProductsError = (state) => state.products?.error || null;
export const selectCurrentProduct = (state) => state.products?.currentProduct || null;

export default productsSlice.reducer;
