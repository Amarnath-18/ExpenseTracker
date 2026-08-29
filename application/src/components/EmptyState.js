import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassButton from './GlassButton';
import tokens from '../theme/tokens';

/**
 * EmptyState
 * Glassmorphic empty state graphic with icon, title, description, and action button.
 */
export default function EmptyState({
  icon = 'wallet-outline',
  title = 'No Expenses Found',
  description = 'You haven’t logged any transactions yet. Tap below or scan a receipt to get started.',
  actionTitle,
  onActionPress,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      {/* Icon with glowing frosted circle */}
      <View style={styles.iconCircle}>
        <View style={styles.innerIconCircle}>
          <Ionicons name={icon} size={38} color={tokens.colors.primaryLight} />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionTitle && onActionPress && (
        <GlassButton
          title={actionTitle}
          onPress={onActionPress}
          variant="primary"
          size="md"
          icon="add"
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xxl,
    paddingHorizontal: tokens.spacing.xl,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(59, 130, 246, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
    ...tokens.shadows.primaryGlow,
  },
  innerIconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: tokens.colors.glassBorderHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  description: {
    fontSize: 14,
    color: tokens.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: tokens.spacing.lg,
  },
  actionButton: {
    minWidth: 180,
  },
});
