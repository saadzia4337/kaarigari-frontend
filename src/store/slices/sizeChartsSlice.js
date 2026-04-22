import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as sizeChartApi from '../../services/sizeChartService';

export const fetchSizeChartsBySeller = createAsyncThunk(
  'sizeCharts/fetchBySeller',
  async (sellerId, { rejectWithValue }) => {
    try {
      return await sizeChartApi.getChartsBySeller(sellerId);
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to load size charts');
    }
  }
);

export const fetchSizeChartBySellerAndCategory = createAsyncThunk(
  'sizeCharts/fetchBySellerAndCategory',
  async ({ sellerId, category }, { rejectWithValue }) => {
    try {
      const chart = await sizeChartApi.getChartBySellerAndCategory(sellerId, category);
      return { sellerId, category, chart };
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to load size chart');
    }
  }
);

export const createSizeChartAsync = createAsyncThunk(
  'sizeCharts/create',
  async (body, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    try {
      return await sizeChartApi.createChart(token, body);
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to create size chart');
    }
  }
);

export const updateSizeChartAsync = createAsyncThunk(
  'sizeCharts/update',
  async ({ id, body }, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    try {
      return await sizeChartApi.updateChart(token, id, body);
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to update size chart');
    }
  }
);

export const deleteSizeChartAsync = createAsyncThunk(
  'sizeCharts/delete',
  async (id, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue('Not authenticated');
    try {
      await sizeChartApi.deleteChart(token, id);
      return id;
    } catch (err) {
      return rejectWithValue(err.userMessage || err.message || 'Failed to delete size chart');
    }
  }
);

const sizeChartsSlice = createSlice({
  name: 'sizeCharts',
  initialState: {
    list: [],
    productChart: null,
    productChartKey: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearProductChart: (state) => {
      state.productChart = null;
      state.productChartKey = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSizeChartsBySeller.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSizeChartsBySeller.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchSizeChartsBySeller.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to load size charts';
      })
      .addCase(fetchSizeChartBySellerAndCategory.fulfilled, (state, action) => {
        const { sellerId, category, chart } = action.payload;
        state.productChart = chart;
        state.productChartKey = `${sellerId}|${category}`;
      })
      .addCase(fetchSizeChartBySellerAndCategory.rejected, (state) => {
        state.productChart = null;
        state.productChartKey = null;
      })
      .addCase(createSizeChartAsync.fulfilled, (state, action) => {
        if (action.payload) state.list = [action.payload, ...state.list];
      })
      .addCase(updateSizeChartAsync.fulfilled, (state, action) => {
        if (action.payload && action.payload._id) {
          const i = state.list.findIndex((c) => c._id === action.payload._id);
          if (i >= 0) state.list[i] = action.payload;
        }
      })
      .addCase(deleteSizeChartAsync.fulfilled, (state, action) => {
        if (action.payload) {
          state.list = state.list.filter((c) => c._id !== action.payload);
        }
      });
  },
});

export const { clearProductChart } = sizeChartsSlice.actions;

export const selectSizeChartsList = (state) => state.sizeCharts.list;
export const selectSizeChartsLoading = (state) => state.sizeCharts.loading;
export const selectSizeChartsError = (state) => state.sizeCharts.error;

export const selectSizeChartForProduct = (state, sellerId, category) => {
  const key = `${sellerId}|${category}`;
  return state.sizeCharts.productChartKey === key ? state.sizeCharts.productChart : null;
};

export default sizeChartsSlice.reducer;
