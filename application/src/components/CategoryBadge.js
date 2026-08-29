import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tokens from '../theme/tokens';

export const CATEGORY_CONFIG = {
  Food: {
    icon: 'fast-food-outline',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.30)',
  },
  Groceries: {
    icon: 'cart-outline',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.30)',
  },
  Shopping: {
    icon: 'bag-handle-outline',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.30)',
  },
  Transport: {
    icon: 'car-outline',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.30)',
  },
  Bills: {
    icon: 'flash-outline',
    color: '#F43F5E',
    bgColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.30)',
  },
  Entertainment: {
    icon: 'film-outline',
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.30)',
  },
  Health: {
    icon: 'medkit-outline',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.30)',
  },
  Other: {
    icon: 'pricetag-outline',
    color: '#94A3B8',
    bgColor: 'rgba(148, 163, 184, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.30)',
  },
};

/**
 * CategoryBadge
 * Visual badge/icon representing the expense category with specific tints and icons.
 */
export default function CategoryBadge({
  category = 'Other',
  size = 'md', // 'sm' | 'md' | 'lg'
  iconOnly = false,
  showLabel = true,
  style,
}) {
  const normalizedCategory =
    Object.keys(CATEGORY_CONFIG).find(
      (key) => key.toLowerCase() === (category || '').trim().toLowerCase()
    ) || 'Other';

  const config = CATEGORY_CONFIG[normalizedCategory] || CATEGORY_CONFIG.Other;

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const containerPadding = {
    sm: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    md: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    lg: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  };

  const textSizes = {
    sm: { fontSize: 11 },
    md: { fontSize: 12 },
    lg: { fontSize: 14 },
  };

  if (iconOnly) {
    const iconOnlySizes = {
      sm: { width: 28, height: 28, borderRadius: 8 },
      md: { width: 40, height: 40, borderRadius: 12 },
      lg: { width: 50, height: 50, borderRadius: 16 },
    };

    return (
      <View
        style={[
          styles.iconOnlyBox,
          iconOnlySizes[size],
          { backgroundColor: config.bgColor, borderColor: config.borderColor },
          style,
        ]}
      >
        <Ionicons name={config.icon} size={iconSizes[size] + 4} color={config.color} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.pillContainer,
        containerPadding[size],
        { backgroundColor: config.bgColor, borderColor: config.borderColor },
        style,
      ]}
    >
      <Ionicons
        name={config.icon}
        size={iconSizes[size]}
        color={config.color}
        style={showLabel ? styles.iconMargin : undefined}
      />
      {showLabel && (
        <Text
          style={[
            styles.label,
            textSizes[size],
            { color: config.color },
          ]}
          numberOfLines={1}
        >
          {normalizedCategory}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  iconOnlyBox: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconMargin: {
    marginRight: 4,
  },
  label: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
