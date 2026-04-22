import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import StarRating from './StarRating';
import { useSelector } from 'react-redux';

const ReviewCard = ({
  review,
  onEdit,
  onDelete,
  showActions = false,
  style,
}) => {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  
  const isAuthor = user?._id === review.user?._id;
  const canEdit = showActions && isAuthor;
  const canDelete = showActions && (isAuthor || user?.role === 'admin');

  const handleEdit = () => {
    if (onEdit) {
      onEdit(review);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete && onDelete(review._id),
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }, style]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {review.user?.profilePic ? (
            <Image source={{ uri: review.user.profilePic }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.border }]}>
              <Text style={[styles.avatarText, { color: theme.text }]}>
                {getInitials(review.user?.firstName, review.user?.lastName)}
              </Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {review.user?.fullName || 'Anonymous User'}
            </Text>
            <View style={styles.ratingRow}>
              <StarRating rating={review.rating} size={14} />
              <Text style={[styles.date, { color: theme.textSecondary }]}>
                {formatDate(review.createdAt)}
              </Text>
            </View>
          </View>
        </View>
        
        {(canEdit || canDelete) && (
          <View style={styles.actions}>
            {canEdit && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={handleEdit}
              >
                <Ionicons name="create-outline" size={16} color={theme.text} />
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#ff4444' }]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {review.comment && (
        <Text style={[styles.comment, { color: theme.textSecondary }]}>
          {review.comment}
        </Text>
      )}
      
      {review.updatedAt && review.updatedAt !== review.createdAt && (
        <Text style={[styles.editedText, { color: theme.textSecondary }]}>
          Edited {formatDate(review.updatedAt)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  editedText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});

export default ReviewCard;
