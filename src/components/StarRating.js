import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';

const StarRating = ({
  rating = 0,
  maxRating = 5,
  size = 16,
  color,
  editable = false,
  onRatingChange,
  showValue = false,
  valueStyle,
  containerStyle,
  starStyle,
}) => {
  const theme = useTheme();
  const starColor = color || theme.primary;
  const emptyStarColor = theme.border;

  const renderStar = (index) => {
    const starNumber = index + 1;
    const filled = rating >= starNumber;
    const halfFilled = rating >= starNumber - 0.5 && rating < starNumber;

    const starIcon = filled ? 'star' : halfFilled ? 'star-half' : 'star-outline';
    const starColorValue = filled || halfFilled ? starColor : emptyStarColor;

    if (editable) {
      return (
        <TouchableOpacity
          key={index}
          onPress={() => onRatingChange && onRatingChange(starNumber)}
          style={[styles.starTouchable, starStyle]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={starIcon}
            size={size}
            color={starColorValue}
            style={styles.star}
          />
        </TouchableOpacity>
      );
    }

    return (
      <Ionicons
        key={index}
        name={starIcon}
        size={size}
        color={starColorValue}
        style={[styles.star, starStyle]}
      />
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      </View>
      {showValue && (
        <Text style={[styles.ratingValue, { color: theme.textSecondary }, valueStyle]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 1,
  },
  starTouchable: {
    padding: 2,
    margin: -2,
  },
  ratingValue: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StarRating;
