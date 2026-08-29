import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tokens from '../theme/tokens';

/**
 * GlassInput
 * Translucent frosted glass text input with icon prefix, active focus glow, password toggling, and validation states.
 */
const GlassInput = React.forwardRef(function GlassInput(
  {
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    error,
    helperText,
    secureTextEntry = false,
    multiline = false,
    numberOfLines = 1,
    required = false,
    containerStyle,
    inputStyle,
    editable = true,
    rightComponent,
    onFocus,
    onBlur,
    returnKeyType,
    onSubmitEditing,
    autoCapitalize = 'none',
    autoCorrect = false,
    keyboardType = 'default',
    ...props
  },
  forwardedRef
) {
  const localInputRef = useRef(null);
  const inputRef = forwardedRef || localInputRef;

  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const handleContainerPress = () => {
    if (editable && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const hasError = Boolean(error);
  const shouldSecureText = secureTextEntry && !isPasswordVisible;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.requiredAsterisk}> *</Text>}
        </View>
      )}

      <Pressable
        onPress={handleContainerPress}
        style={[
          styles.inputWrapper,
          multiline && styles.multilineWrapper,
          isFocused && styles.inputWrapperFocused,
          hasError && styles.inputWrapperError,
          !editable && styles.inputWrapperDisabled,
        ]}
      >
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon}
              size={20}
              color={
                hasError
                  ? tokens.colors.dangerLight
                  : isFocused
                  ? tokens.colors.primaryLight
                  : tokens.colors.textMuted
              }
            />
          </View>
        )}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.textMuted}
          secureTextEntry={shouldSecureText}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          autoCapitalize={secureTextEntry ? 'none' : autoCapitalize}
          autoCorrect={secureTextEntry ? false : autoCorrect}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          underlineColorAndroid="transparent"
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            icon && styles.inputWithIcon,
            inputStyle,
          ]}
          selectionColor={tokens.colors.primary}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.actionButton}
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={isPasswordVisible ? tokens.colors.primaryLight : tokens.colors.textMuted}
            />
          </TouchableOpacity>
        )}

        {rightComponent}
      </Pressable>

      {hasError ? (
        <View style={styles.feedbackRow}>
          <Ionicons name="alert-circle-outline" size={14} color={tokens.colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
});

export default GlassInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs + 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  requiredAsterisk: {
    fontSize: 14,
    color: tokens.colors.dangerLight,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.glassInput,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.glassBorder,
    minHeight: 52,
    paddingHorizontal: tokens.spacing.md,
  },
  multilineWrapper: {
    alignItems: 'flex-start',
    paddingVertical: tokens.spacing.sm,
  },
  inputWrapperFocused: {
    borderColor: tokens.colors.primaryLight,
    backgroundColor: 'rgba(23, 32, 54, 0.85)',
    ...tokens.shadows.primaryGlow,
  },
  inputWrapperError: {
    borderColor: tokens.colors.danger,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  inputWrapperDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    marginRight: tokens.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: tokens.colors.text,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    paddingHorizontal: 0,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButton: {
    padding: tokens.spacing.xs,
    marginLeft: tokens.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: tokens.spacing.xs,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: tokens.colors.dangerLight,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: tokens.colors.textDim,
    marginTop: tokens.spacing.xs,
  },
});
