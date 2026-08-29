import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import tokens from '../theme/tokens';

/**
 * GlassHeader
 * Safe-area aware frosted glass header with navigation buttons and contextual actions.
 */
export default function GlassHeader({
  title,
  subtitle,
  badge,
  showBack = false,
  onBack,
  rightActions,
  style,
}) {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);

  const headerContent = (
    <View style={[styles.innerHeader, { paddingTop: topPadding }]}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={tokens.colors.text} />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
          {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
      </View>

      {rightActions && (
        <View style={styles.rightContainer}>
          {rightActions}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFillObject} />
      ) : null}
      {headerContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.glassBorder,
    zIndex: 10,
  },
  innerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.md,
    minHeight: 56,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.glassLight,
    borderWidth: 1,
    borderColor: tokens.colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.sm,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.round,
    marginBottom: 2,
  },
  badgeText: {
    color: tokens.colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
});
