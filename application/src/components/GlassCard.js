import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
          backgroundColor: 'rgba(26, 36, 60, 0.75)',
          borderColor: 'rgba(255, 255, 255, 0.16)',
          ...tokens.shadows.card,
        };
      case 'highlight':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
          borderColor: 'rgba(59, 130, 246, 0.35)',
          ...tokens.shadows.primaryGlow,
        };
      case 'subtle':
        return {
          backgroundColor: 'rgba(30, 41, 59, 0.45)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        };
      case 'hero':
        return {
          backgroundColor: 'rgba(23, 32, 54, 0.82)',
          borderColor: 'rgba(255, 255, 255, 0.18)',
          ...tokens.shadows.card,
        };
      case 'danger':
        return {
          backgroundColor: 'rgba(244, 63, 94, 0.10)',
          borderColor: 'rgba(244, 63, 94, 0.28)',
          ...tokens.shadows.dangerGlow,
        };
      case 'default':
      default:
        return {
          backgroundColor: tokens.colors.glassCard,
          borderColor: tokens.colors.glassBorder,
          ...tokens.shadows.subtle,
        };
    }
  };

  const cardContent = (
    <View style={[styles.innerContent, contentStyle]}>
      {/* Top subtle highlight reflection line */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topReflection}
        pointerEvents="none"
      />
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
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={intensity}
          tint="dark"
          style={styles.blurLayer}
        >
          {cardContent}
        </BlurView>
      ) : (
        cardContent
      )}
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
  topReflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
