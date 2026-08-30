import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import tokens from '../theme/tokens';

/**
 * GlassCard
 * Frosted translucent glass container with subtle border shine, inner glow, and elevation.
 */
export default function GlassCard({
  children,
  style,
  contentStyle,
  variant = 'default', // 'default' | 'elevated' | 'highlight' | 'subtle' | 'hero' | 'danger'
  onPress,
  activeOpacity = 0.85,
  intensity = tokens.blurIntensity,
  ...props
}) {
  const isInteractive = typeof onPress === 'function';
  const ContainerComponent = isInteractive ? TouchableOpacity : View;

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: '#1E293B',
          borderColor: tokens.colors.glassBorderHighlight,
          ...(Platform.OS === 'ios' ? tokens.shadows.card : { elevation: 3 }),
        };
      case 'highlight':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
          borderColor: 'rgba(59, 130, 246, 0.35)',
          ...(Platform.OS === 'ios' ? tokens.shadows.primaryGlow : { elevation: 2 }),
        };
      case 'subtle':
        return {
          backgroundColor: 'rgba(30, 41, 59, 0.45)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        };
      case 'hero':
        return {
          backgroundColor: '#1E293B',
          borderColor: tokens.colors.glassBorderHighlight,
          ...(Platform.OS === 'ios' ? tokens.shadows.card : { elevation: 3 }),
        };
      case 'danger':
        return {
          backgroundColor: '#2A141E',
          borderColor: 'rgba(244, 63, 94, 0.35)',
          ...(Platform.OS === 'ios' ? tokens.shadows.dangerGlow : { elevation: 0 }),
        };
      case 'default':
      default:
        return {
          backgroundColor: tokens.colors.glassCard,
          borderColor: tokens.colors.glassBorder,
          ...(Platform.OS === 'ios' ? tokens.shadows.subtle : { elevation: 2 }),
        };
    }
  };

  const cardContent = (
    <View style={[styles.innerContent, contentStyle]}>
      {children}
    </View>
  );

  return (
    <ContainerComponent
      onPress={onPress}
      activeOpacity={activeOpacity}
      style={[
        styles.cardContainer,
        getVariantStyles(),
        style,
      ]}
      accessibilityRole={isInteractive ? 'button' : undefined}
      {...props}
    >
      {cardContent}
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  blurLayer: {
    width: '100%',
    height: '100%',
  },
  innerContent: {
    padding: tokens.spacing.md,
    position: 'relative',
  },
});
