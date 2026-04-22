import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import StarRating from './StarRating';
import { useSelector, useDispatch } from 'react-redux';
import { createReviewAsync, updateReviewAsync, selectReviewsCreating, selectReviewsUpdating } from '../store/slices/reviewsSlice';
import { showToast } from '../store/slices/toastSlice';

const ReviewForm = ({
  productId,
  initialReview = null,
  onSubmit,
  onCancel,
  style,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const creating = useSelector(selectReviewsCreating);
  const updating = useSelector(selectReviewsUpdating);
  const { user, token } = useSelector((state) => state.auth);
  
  const [rating, setRating] = useState(initialReview?.rating || 0);
  const [comment, setComment] = useState(initialReview?.comment || '');
  const [ratingError, setRatingError] = useState('');

  useEffect(() => {
    if (initialReview) {
      setRating(initialReview.rating);
      setComment(initialReview.comment);
    } else {
      setRating(0);
      setComment('');
    }
    setRatingError('');
  }, [initialReview]);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to write a review.');
      return;
    }

    if (rating === 0) {
      setRatingError('Please select a rating');
      return;
    }

    const reviewData = {
      rating,
      comment: comment.trim(),
    };

    try {
      if (initialReview) {
        // Update existing review
        await dispatch(updateReviewAsync({
          reviewId: initialReview._id,
          reviewData,
          token,
        })).unwrap();
        dispatch(showToast('Review updated successfully!'));
      } else {
        // Create new review
        await dispatch(createReviewAsync({
          productId,
          reviewData,
          token,
        })).unwrap();
        dispatch(showToast('Review added successfully!'));
      }
      
      // Reset form
      setRating(0);
      setComment('');
      setRatingError('');
      
      if (onSubmit) {
        onSubmit();
      }
    } catch (error) {
      Alert.alert('Error', error || 'Failed to save review. Please try again.');
    }
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
    setRatingError('');
  };

  const isSubmitting = creating || updating;
  const canSubmit = rating > 0 && !isSubmitting;

  return (
    <View style={[styles.container, { backgroundColor: theme.card }, style]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {initialReview ? 'Edit Your Review' : 'Write a Review'}
        </Text>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.formContent}>
        <View style={styles.ratingSection}>
          <Text style={[styles.label, { color: theme.text }]}>Rating *</Text>
          <StarRating
            rating={rating}
            editable={true}
            onRatingChange={handleRatingChange}
            size={24}
            showValue={true}
            containerStyle={styles.starRatingContainer}
          />
          {ratingError ? (
            <Text style={[styles.errorText, { color: '#ff4444' }]}>
              {ratingError}
            </Text>
          ) : null}
        </View>

        <View style={styles.commentSection}>
          <Text style={[styles.label, { color: theme.text }]}>
            Review Comment (Optional)
          </Text>
          <TextInput
            style={[
              styles.commentInput,
              {
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience with this product..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={[styles.characterCount, { color: theme.textSecondary }]}>
            {comment.length}/500
          </Text>
        </View>

        <View style={styles.actions}>
          {onCancel && (
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { backgroundColor: theme.border },
              ]}
              onPress={onCancel}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: canSubmit ? theme.primary : theme.border,
                opacity: canSubmit ? 1 : 0.6,
              },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {initialReview ? 'Update Review' : 'Submit Review'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  formContent: {
    gap: 16,
  },
  ratingSection: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  starRatingContainer: {
    marginVertical: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  commentSection: {
    gap: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReviewForm;
