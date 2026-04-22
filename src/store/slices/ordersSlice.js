import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getOrders as fetchOrders,
  getMyPurchases as fetchMyPurchases,
  getOrderById as fetchOrderById,
  createOrder as placeOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getSellerOrders,
  formatOrderStatus,
  getStatusColor,
  formatOrderDate,
  formatPrice
} from '../../services/orderService';
import { removeOrderedItems } from './cartSlice';

// Async thunks
export const fetchMyPurchasesAsync = createAsyncThunk(
  'orders/fetchMyPurchases',
  async ({ page = 1, limit = 10, status = null } = {}, { rejectWithValue }) => {
    try {
      const response = await fetchMyPurchases(page, limit, status);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchOrdersAsync = createAsyncThunk(
  'orders/fetchOrders',
  async ({ page = 1, limit = 10, status = null } = {}, { rejectWithValue }) => {
    try {
      const response = await fetchOrders(page, limit, status);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchOrderByIdAsync = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      const order = await fetchOrderById(orderId);
      return order;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const createOrderAsync = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue, dispatch }) => {
    try {
      const order = await placeOrder(orderData);
      
      // Dispatch action to remove ordered items from cart
      dispatch(removeOrderedItems(order.items));
      
      return order;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const updateOrderStatusAsync = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status, notes }, { rejectWithValue }) => {
    try {
      const order = await updateOrderStatus(orderId, status, notes);
      return order;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const cancelOrderAsync = createAsyncThunk(
  'orders/cancelOrder',
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const order = await cancelOrder(orderId, reason);
      return order;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchSellerOrdersAsync = createAsyncThunk(
  'orders/fetchSellerOrders',
  async ({ sellerId, page = 1, limit = 10, status = null }, { rejectWithValue }) => {
    try {
      const response = await getSellerOrders(sellerId, page, limit, status);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchOrderStatsAsync = createAsyncThunk(
  'orders/fetchOrderStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await getOrderStats();
      return stats;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const initialState = {
  orders: [],
  currentOrder: null,
  stats: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },
  loading: false,
  creating: false,
  updating: false,
  cancelling: false,
  error: null,
  createError: null,
  updateError: null,
  cancelError: null,
  filters: {
    status: null
  }
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.createError = null;
      state.updateError = null;
      state.cancelError = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetOrders: (state) => {
      state.orders = [];
      state.pagination = initialState.pagination;
      state.filters = initialState.filters;
    },
    updateOrderInList: (state, action) => {
      const updatedOrder = action.payload;
      const index = state.orders.findIndex(order => order._id === updatedOrder._id);
      if (index !== -1) {
        state.orders[index] = updatedOrder;
      }
      if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
        state.currentOrder = updatedOrder;
      }
    },
    updateCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Fetch my purchases
    builder
      .addCase(fetchMyPurchasesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyPurchasesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMyPurchasesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch orders
    builder
      .addCase(fetchOrdersAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdersAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrdersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch order by ID
    builder
      .addCase(fetchOrderByIdAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderByIdAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderByIdAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create order
    builder
      .addCase(createOrderAsync.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createOrderAsync.fulfilled, (state, action) => {
        state.creating = false;
        state.orders.unshift(action.payload);
        state.pagination.total += 1;
        // Cart items are removed via the dispatched removeOrderedItems action
      })
      .addCase(createOrderAsync.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload;
      });

    // Update order status
    builder
      .addCase(updateOrderStatusAsync.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateOrderStatusAsync.fulfilled, (state, action) => {
        state.updating = false;
        const updatedOrder = action.payload;
        const index = state.orders.findIndex(order => order._id === updatedOrder._id);
        if (index !== -1) {
          state.orders[index] = updatedOrder;
        }
        if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
          state.currentOrder = updatedOrder;
        }
      })
      .addCase(updateOrderStatusAsync.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload;
      });

    // Cancel order
    builder
      .addCase(cancelOrderAsync.pending, (state) => {
        state.cancelling = true;
        state.cancelError = null;
      })
      .addCase(cancelOrderAsync.fulfilled, (state, action) => {
        state.cancelling = false;
        const cancelledOrder = action.payload;
        const index = state.orders.findIndex(order => order._id === cancelledOrder._id);
        if (index !== -1) {
          state.orders[index] = cancelledOrder;
        }
        if (state.currentOrder && state.currentOrder._id === cancelledOrder._id) {
          state.currentOrder = cancelledOrder;
        }
      })
      .addCase(cancelOrderAsync.rejected, (state, action) => {
        state.cancelling = false;
        state.cancelError = action.payload;
      });

    // Fetch seller orders
    builder
      .addCase(fetchSellerOrdersAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerOrdersAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSellerOrdersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch order stats
    builder
      .addCase(fetchOrderStatsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderStatsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchOrderStatsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectOrders = (state) => state.orders.orders;
export const selectCurrentOrder = (state) => state.orders.currentOrder;
export const selectOrdersPagination = (state) => state.orders.pagination;
export const selectOrdersLoading = (state) => state.orders.loading;
export const selectOrdersCreating = (state) => state.orders.creating;
export const selectOrdersUpdating = (state) => state.orders.updating;
export const selectOrdersCancelling = (state) => state.orders.cancelling;
export const selectOrdersError = (state) => state.orders.error;
export const selectOrdersCreateError = (state) => state.orders.createError;
export const selectOrdersUpdateError = (state) => state.orders.updateError;
export const selectOrdersCancelError = (state) => state.orders.cancelError;
export const selectOrdersStats = (state) => state.orders.stats;
export const selectOrdersFilters = (state) => state.orders.filters;

// Helper selectors
export const selectOrdersByStatus = (state, status) => {
  if (!status) return selectOrders(state);
  return selectOrders(state).filter(order => order.status === status);
};

export const selectUserOrders = (state, userId) => {
  return selectOrders(state).filter(order => order.user._id === userId);
};

export const selectSellerOrders = (state, sellerId) => {
  return selectOrders(state).filter(order => 
    order.items.some(item => item.seller._id === sellerId)
  );
};

// Enhanced selectors with formatted data
export const selectFormattedOrders = (state) => {
  return selectOrders(state).map(order => ({
    ...order,
    formattedStatus: formatOrderStatus(order.status),
    statusColor: getStatusColor(order.status),
    formattedDate: formatOrderDate(order.orderDate),
    formattedTotal: formatPrice(order.totalAmount),
    formattedDeliveryDate: order.deliveryDate ? formatOrderDate(order.deliveryDate) : null
  }));
};

export const selectFormattedCurrentOrder = (state) => {
  const order = selectCurrentOrder(state);
  if (!order) return null;
  
  return {
    ...order,
    formattedStatus: formatOrderStatus(order.status),
    statusColor: getStatusColor(order.status),
    formattedDate: formatOrderDate(order.orderDate),
    formattedTotal: formatPrice(order.totalAmount),
    formattedDeliveryDate: order.deliveryDate ? formatOrderDate(order.deliveryDate) : null
  };
};

export const {
  clearError,
  clearCurrentOrder,
  setFilters,
  resetOrders,
  updateOrderInList,
  updateCurrentOrder
} = ordersSlice.actions;

export default ordersSlice.reducer;
