import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productsReducer from './slices/productsSlice';
import cartReducer from './slices/cartSlice';
import wishlistReducer from './slices/wishlistSlice';
import toastReducer from './slices/toastSlice';
import bannersReducer from './slices/bannersSlice';
import categoriesReducer from './slices/categoriesSlice';
import sizeChartsReducer from './slices/sizeChartsSlice';
import ordersReducer from './slices/ordersSlice';
import alertReducer from './slices/alertSlice';
import reviewsReducer from './slices/reviewsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    toast: toastReducer,
    banners: bannersReducer,
    categories: categoriesReducer,
    sizeCharts: sizeChartsReducer,
    orders: ordersReducer,
    alerts: alertReducer,
    reviews: reviewsReducer,
  },
});
