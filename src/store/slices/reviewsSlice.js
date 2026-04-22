import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getProductReviews as getProductReviewsApi,
  getReviewStats as getReviewStatsApi,
  getUserReview as getUserReviewApi,
  createReview as createReviewApi,
  updateReview as updateReviewApi,
  deleteReview as deleteReviewApi,
} from '../../services/reviewService';

export const fetchProductReviews = createAsyncThunk(
  'reviews/fetchProductReviews',
  async ({ productId, page = 1, limit = 10, sort = 'newest' }, { rejectWithValue }) => {
    try {
      const response = await getProductReviewsApi(productId, { page, limit, sort });
      return { productId, ...response };
    } catch (err) {
      return rejectWithValue(
        err.userMessage || err.response?.data?.message || err.message || 'Failed to load reviews'
      );
    }
  }
);

export const fetchReviewStats = createAsyncThunk(
  'reviews/fetchReviewStats',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await getReviewStatsApi(productId);
      return { productId, stats: response };
    } catch (err) {
      return rejectWithValue(
        err.userMessage || err.response?.data?.message || err.message || 'Failed to load review statistics'
      );
    }
  }
);

export const fetchUserReview = createAsyncThunk(
  'reviews/fetchUserReview',
  async ({ productId, token }, { rejectWithValue }) => {
    try {
      const response = await getUserReviewApi(productId, token);
      return { productId, userReview: response };
    } catch (err) {
      return rejectWithValue(
        err.userMessage || err.response?.data?.message || err.message || 'Failed to load your review'
      );
    }
  }
);

export const createReviewAsync = createAsyncThunk(
  'reviews/createReview',
  async ({ productId, reviewData, token }, { rejectWithValue }) => {
    try {
      const response = await createReviewApi(productId, reviewData, token);
      return { productId, review: response };
    } catch (err) {
      return rejectWithValue(
        err.userMessage || err.response?.data?.message || err.message || 'Failed to create review'
      );
    }
  }
);

export const updateReviewAsync = createAsyncThunk(
  'reviews/updateReview',
  async ({ reviewId, reviewData, token }, { rejectWithValue }) => {
    try {
      const response = await updateReviewApi(reviewId, reviewData, token);
      return { review: response };
    } catch (err) {
      return rejectWithValue(
        err.userMessage || err.response?.data?.message || err.message || 'Failed to update review'
      );
    }
  }
);

export const deleteReviewAsync = createAsyncThunk(
  'reviews/deleteReview',
  async ({ reviewId, token }, { rejectWithValue }) => {
    try {
      await deleteReviewApi(reviewId, token);
      return { reviewId };
    } catch (err) {
      return rejectWithValue(
        err.userMessage || err.response?.data?.message || err.message || 'Failed to delete review'
      );
    }
  }
);

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: {
    // Reviews by product ID
    reviewsByProduct: {},
    // Review stats by product ID
    statsByProduct: {},
    // User's review by product ID
    userReviewsByProduct: {},
    loading: false,
    creating: false,
    updating: false,
    deleting: false,
    error: null,
  },
  reducers: {
    clearReviewsError: (state) => {
      state.error = null;
    },
    clearProductReviews: (state, action) => {
      const productId = action.payload;
      delete state.reviewsByProduct[productId];
      delete state.statsByProduct[productId];
      delete state.userReviewsByProduct[productId];
    },
    clearAllReviews: (state) => {
      state.reviewsByProduct = {};
      state.statsByProduct = {};
      state.userReviewsByProduct = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProductReviews
      .addCase(fetchProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        const { productId, reviews, pagination } = action.payload;
        if (!state.reviewsByProduct[productId]) {
          state.reviewsByProduct[productId] = {
            reviews: [],
            pagination: null,
          };
        }
        state.reviewsByProduct[productId].reviews = reviews;
        state.reviewsByProduct[productId].pagination = pagination;
        state.error = null;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to load reviews';
      })
      // fetchReviewStats
      .addCase(fetchReviewStats.fulfilled, (state, action) => {
        const { productId, stats } = action.payload;
        state.statsByProduct[productId] = stats;
      })
      .addCase(fetchReviewStats.rejected, (state, action) => {
        console.error('Failed to load review stats:', action.payload);
      })
      // fetchUserReview
      .addCase(fetchUserReview.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchUserReview.fulfilled, (state, action) => {
        const { productId, userReview } = action.payload;
        state.userReviewsByProduct[productId] = userReview;
        state.error = null;
      })
      .addCase(fetchUserReview.rejected, (state, action) => {
        // Don't set error state for 404 (user hasn't reviewed yet)
        if (action.payload && !action.payload.includes('not found')) {
          state.error = action.payload;
        }
      })
      // createReviewAsync
      .addCase(createReviewAsync.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createReviewAsync.fulfilled, (state, action) => {
        state.creating = false;
        const { productId, review } = action.payload;
        
        // Add to reviews list
        if (!state.reviewsByProduct[productId]) {
          state.reviewsByProduct[productId] = {
            reviews: [],
            pagination: null,
          };
        }
        state.reviewsByProduct[productId].reviews.unshift(review);
        
        // Set as user's review
        state.userReviewsByProduct[productId] = review;
        
        // Update stats
        if (state.statsByProduct[productId]) {
          const stats = state.statsByProduct[productId];
          const newTotal = stats.reviewCount + 1;
          const newAverage = ((stats.averageRating * stats.reviewCount) + review.rating) / newTotal;
          stats.reviewCount = newTotal;
          stats.averageRating = Math.round(newAverage * 10) / 10;
          
          // Update distribution
          if (stats.distribution) {
            stats.distribution[review.rating] = (stats.distribution[review.rating] || 0) + 1;
          }
        }
        
        state.error = null;
      })
      .addCase(createReviewAsync.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? 'Failed to create review';
      })
      // updateReviewAsync
      .addCase(updateReviewAsync.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateReviewAsync.fulfilled, (state, action) => {
        state.updating = false;
        const { review } = action.payload;
        
        // Update review in all product lists
        Object.keys(state.reviewsByProduct).forEach(productId => {
          const productReviews = state.reviewsByProduct[productId];
          const index = productReviews.reviews.findIndex(r => r._id === review._id);
          if (index !== -1) {
            productReviews.reviews[index] = review;
          }
        });
        
        // Update user's review
        Object.keys(state.userReviewsByProduct).forEach(productId => {
          if (state.userReviewsByProduct[productId]?._id === review._id) {
            state.userReviewsByProduct[productId] = review;
          }
        });
        
        state.error = null;
      })
      .addCase(updateReviewAsync.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload ?? 'Failed to update review';
      })
      // deleteReviewAsync
      .addCase(deleteReviewAsync.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteReviewAsync.fulfilled, (state, action) => {
        state.deleting = false;
        const { reviewId } = action.payload;
        
        // Remove review from all product lists
        Object.keys(state.reviewsByProduct).forEach(productId => {
          const productReviews = state.reviewsByProduct[productId];
          const index = productReviews.reviews.findIndex(r => r._id === reviewId);
          if (index !== -1) {
            const deletedReview = productReviews.reviews[index];
            productReviews.reviews.splice(index, 1);
            
            // Update pagination
            if (productReviews.pagination) {
              productReviews.pagination.totalReviews -= 1;
              productReviews.pagination.totalPages = Math.ceil(
                productReviews.pagination.totalReviews / 10
              );
            }
            
            // Update stats
            if (state.statsByProduct[productId]) {
              const stats = state.statsByProduct[productId];
              const newTotal = Math.max(0, stats.reviewCount - 1);
              const newAverage = newTotal > 0 
                ? ((stats.averageRating * stats.reviewCount) - deletedReview.rating) / newTotal
                : 0;
              stats.reviewCount = newTotal;
              stats.averageRating = Math.round(newAverage * 10) / 10;
              
              // Update distribution
              if (stats.distribution && stats.distribution[deletedReview.rating]) {
                stats.distribution[deletedReview.rating] = Math.max(0, 
                  stats.distribution[deletedReview.rating] - 1
                );
              }
            }
          }
        });
        
        // Remove from user reviews
        Object.keys(state.userReviewsByProduct).forEach(productId => {
          if (state.userReviewsByProduct[productId]?._id === reviewId) {
            delete state.userReviewsByProduct[productId];
          }
        });
        
        state.error = null;
      })
      .addCase(deleteReviewAsync.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload ?? 'Failed to delete review';
      });
  },
});

export const { clearReviewsError, clearProductReviews, clearAllReviews } = reviewsSlice.actions;

// Selectors
export const selectProductReviews = (state, productId) => 
  state.reviews?.reviewsByProduct[productId]?.reviews || [];

export const selectReviewsPagination = (state, productId) => 
  state.reviews?.reviewsByProduct[productId]?.pagination || null;

export const selectReviewStats = (state, productId) => 
  state.reviews?.statsByProduct[productId] || null;

export const selectUserReview = (state, productId) => 
  state.reviews?.userReviewsByProduct[productId] || null;

export const selectReviewsLoading = (state) => state.reviews?.loading || false;
export const selectReviewsCreating = (state) => state.reviews?.creating || false;
export const selectReviewsUpdating = (state) => state.reviews?.updating || false;
export const selectReviewsDeleting = (state) => state.reviews?.deleting || false;
export const selectReviewsError = (state) => state.reviews?.error || null;

export default reviewsSlice.reducer;
