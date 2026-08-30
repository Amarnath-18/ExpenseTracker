import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import tokens from '../theme/tokens';

/**
 * GlassButton
 * Premium gradient or frosted glass button with micro-shadows, icon integration, and loading states.
 */
export default function GlassButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'accent' | 'secondary' | 'danger' | 'ghost' | 'emerald'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...props
}) {
  const isGradient = variant === 'primary' || variant === 'accent' || variant === 'emerald';

  const getGradientColors = () => {
    switch (variant) {
      case 'accent':
        return tokens.gradients.accent;
      case 'emerald':
        return tokens.gradients.emerald;
      case 'primary':
      default:
        return tokens.gradients.primary;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: tokens.colors.glassButton,
          borderColor: tokens.colors.glassBorderHighlight,
          borderWidth: 1,
        };
      case 'danger':
        return {
          backgroundColor: '#2A141E',
          borderColor: 'rgba(244, 63, 94, 0.40)',
          borderWidth: 1,
          ...(Platform.OS === 'ios' ? tokens.shadows.dangerGlow : { elevation: 0 }),
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      case 'primary':
        return Platform.OS === 'ios' ? tokens.shadows.primaryGlow : { elevation: 2 };
      case 'accent':
        return Platform.OS === 'ios' ? tokens.shadows.accentGlow : { elevation: 2 };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          height: 36,
          paddingHorizontal: 12,
          borderRadius: tokens.borderRadius.sm,
        };
      case 'lg':
        return {
          height: 48,
          paddingHorizontal: 20,
          borderRadius: tokens.borderRadius.md,
        };
      case 'md':
      default:
        return {
          height: 42,
          paddingHorizontal: 16,
          borderRadius: tokens.borderRadius.md,
        };
    }
  };

  const getTextColor = () => {
    if (disabled) return tokens.colors.textDisabled;
    if (variant === 'ghost') return tokens.colors.primaryLight;
    if (variant === 'danger') return tokens.colors.dangerLight;
    return tokens.colors.text;
  };

  const iconComponent = icon && (
    <Ionicons
      name={icon}
      size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18}
      color={getTextColor()}
      style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
    />
  );

  const buttonContent = (
    <View style={styles.contentRow}>
      {loading ? (
        <ActivityIndicator
          size={size === 'sm' ? 'small' : 'small'}
          color={getTextColor()}
        />
      ) : (
        <>
          {iconPosition === 'left' && iconComponent}
          {title ? (
            <Text
              style={[
                styles.buttonText,
                size === 'sm' && styles.textSm,
                size === 'lg' && styles.textLg,
                { color: getTextColor() },
                textStyle,
              ]}
            >
              {title}
            </Text>
          ) : null}
          {iconPosition === 'right' && iconComponent}
        </>
      )}
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[
        styles.buttonBase,
        getSizeStyles(),
        getVariantStyles(),
        disabled && styles.buttonDisabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      {...props}
    >
      {isGradient && !disabled ? (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: getSizeStyles().borderRadius }]}
        />
      ) : null}
      {buttonContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: 13,
  },
  textLg: {
    fontSize: 16,
  },
  iconLeft: {
    marginRight: tokens.spacing.sm,
  },
  iconRight: {
    marginLeft: tokens.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
});
