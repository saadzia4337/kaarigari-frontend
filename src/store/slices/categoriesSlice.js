import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as categoryApi from '../../services/categoryService';

export const fetchCategories = createAsyncThunk(
  'categories/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await categoryApi.getCategories();
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to load categories');
    }
  }
);

export const createCategoryAsync = createAsyncThunk(
  'categories/create',
  async (formData, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    try {
      return await categoryApi.createCategory(token, formData);
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to create category');
    }
  }
);

export const updateCategoryAsync = createAsyncThunk(
  'categories/update',
  async ({ id, formData }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    try {
      return await categoryApi.updateCategory(token, id, formData);
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to update category');
    }
  }
);

export const deleteCategoryAsync = createAsyncThunk(
  'categories/delete',
  async (id, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    try {
      await categoryApi.deleteCategory(token, id);
      return id;
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to delete category');
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to load categories';
      })
      .addCase(createCategoryAsync.fulfilled, (state, action) => {
        if (action.payload) state.list = [action.payload, ...state.list];
      })
      .addCase(updateCategoryAsync.fulfilled, (state, action) => {
        if (action.payload && action.payload._id) {
          const i = state.list.findIndex((c) => c._id === action.payload._id);
          if (i >= 0) state.list[i] = action.payload;
        }
      })
      .addCase(deleteCategoryAsync.fulfilled, (state, action) => {
        if (action.payload) {
          state.list = state.list.filter((c) => c._id !== action.payload);
        }
      });
  },
});

export const selectCategories = (state) => state.categories.list;
export const selectCategoriesLoading = (state) => state.categories.loading;
export const selectCategoriesError = (state) => state.categories.error;

export default categoriesSlice.reducer;
