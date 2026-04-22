import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchProductReviews,
  fetchReviewStats,
  fetchUserReview,
  deleteReviewAsync,
  selectProductReviews,
  selectReviewsPagination,
  selectReviewStats,
  selectUserReview,
  selectReviewsLoading,
  selectReviewsDeleting,
  clearReviewsError,
} from '../store/slices/reviewsSlice';
import { showToast } from '../store/slices/toastSlice';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';

const ReviewsSection = ({ productId, style }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Selectors
  const reviews = useSelector((state) => selectProductReviews(state, productId));
  const pagination = useSelector((state) => selectReviewsPagination(state, productId));
  const stats = useSelector((state) => selectReviewStats(state, productId));
  const userReview = useSelector((state) => selectUserReview(state, productId));
  const loading = useSelector(selectReviewsLoading);
  const deleting = useSelector(selectReviewsDeleting);
  const { user } = useSelector((state) => state.auth);
  
  // Local state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (productId) {
      loadReviews();
      loadStats();
      if (user) {
        loadUserReview();
      }
    }
  }, [productId, user]);

  useEffect(() => {
    loadReviews();
  }, [sortOption, currentPage]);

  const loadReviews = () => {
    dispatch(fetchProductReviews({
      productId,
      page: currentPage,
      limit: 10,
      sort: sortOption,
    }));
  };

  const loadStats = () => {
    dispatch(fetchReviewStats(productId));
  };

  const loadUserReview = () => {
    if (user && user.token) {
      dispatch(fetchUserReview({
        productId,
        token: user.token,
      }));
    }
  };

  const handleAddReview = () => {
    setEditingReview(null);
    setShowReviewForm(true);
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = (reviewId) => {
    dispatch(deleteReviewAsync({
      reviewId,
      token: user.token,
    })).unwrap()
      .then(() => {
        dispatch(showToast('Review deleted successfully'));
        loadUserReview();
      })
      .catch((error) => {
        dispatch(showToast(error || 'Failed to delete review'));
      });
  };

  const handleReviewSubmit = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    loadReviews();
    loadStats();
    loadUserReview();
  };

  const handleReviewCancel = () => {
    setShowReviewForm(false);
    setEditingReview(null);
  };

  const handleSortChange = (newSort) => {
    setSortOption(newSort);
    setCurrentPage(1);
  };

  const handleLoadMore = () => {
    if (pagination?.hasNext && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const renderSortOptions = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
      {[
        { key: 'newest', label: 'Newest' },
        { key: 'oldest', label: 'Oldest' },
        { key: 'highest', label: 'Highest Rating' },
        { key: 'lowest', label: 'Lowest Rating' },
      ].map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.sortOption,
            {
              backgroundColor: sortOption === option.key ? theme.primary : theme.backgroundSecondary,
              borderColor: theme.border,
            },
          ]}
          onPress={() => handleSortChange(option.key)}
        >
          <Text
            style={[
              styles.sortOptionText,
              {
                color: sortOption === option.key ? '#fff' : theme.text,
              },
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderReviewStats = () => {
    if (!stats) return null;

    return (
      <View style={[styles.statsContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={styles.overallRating}>
          <Text style={[styles.ratingNumber, { color: theme.text }]}>
            {stats.averageRating.toFixed(1)}
          </Text>
          <StarRating rating={stats.averageRating} size={16} />
          <Text style={[styles.reviewCount, { color: theme.textSecondary }]}>
            {stats.reviewCount} {stats.reviewCount === 1 ? 'Review' : 'Reviews'}
          </Text>
        </View>
        
        {stats.distribution && (
          <View style={styles.distribution}>
            {Object.entries(stats.distribution)
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .map(([rating, count]) => {
                const percentage = stats.reviewCount > 0 ? (count / stats.reviewCount) * 100 : 0;
                return (
                  <View key={rating} style={styles.distributionRow}>
                    <Text style={[styles.distributionLabel, { color: theme.text }]}>
                      {rating}★
                    </Text>
                    <View style={[styles.distributionBar, { backgroundColor: theme.border }]}>
                      <View
                        style={[
                          styles.distributionFill,
                          {
                            backgroundColor: theme.primary,
                            width: `${percentage}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.distributionCount, { color: theme.textSecondary }]}>
                      {count}
                    </Text>
                  </View>
                );
              })}
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.title, { color: theme.text }]}>
        Reviews ({stats?.reviewCount || 0})
      </Text>
      {user && !userReview && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={handleAddReview}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Write Review</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="star-outline" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
        No reviews yet
      </Text>
      {user && !userReview && (
        <Text style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
          Be the first to share your experience!
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {renderHeader()}
      
      {stats && renderReviewStats()}
      
      {reviews.length > 0 && renderSortOptions()}
      
      <ScrollView style={styles.reviewsList} showsVerticalScrollIndicator={false}>
        {loading && currentPage === 1 ? (
          <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
        ) : reviews.length === 0 ? (
          renderEmptyState()
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onEdit={handleEditReview}
              onDelete={handleDeleteReview}
              showActions={true}
            />
          ))
        )}
        
        {pagination?.hasNext && (
          <TouchableOpacity
            style={[styles.loadMoreButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={handleLoadMore}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.loadMoreText, { color: theme.primary }]}>
                Load More Reviews
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        visible={showReviewForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleReviewCancel}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <ReviewForm
            productId={productId}
            initialReview={editingReview}
            onSubmit={handleReviewSubmit}
            onCancel={handleReviewCancel}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  overallRating: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  reviewCount: {
    fontSize: 14,
    marginTop: 4,
  },
  distribution: {
    gap: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distributionLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 20,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 12,
    width: 30,
    textAlign: 'right',
  },
  sortContainer: {
    marginBottom: 16,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewsList: {
    maxHeight: 400,
  },
  loader: {
    paddingVertical: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadMoreButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
});

export default ReviewsSection;
