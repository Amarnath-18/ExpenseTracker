import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { signupUser } from '../api/auth';
import tokens from '../theme/tokens';
import BackgroundGlow from '../components/BackgroundGlow';
import GlassCard from '../components/GlassCard';
import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';

export default function SignupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Refs for keyboard next-field focus
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  const validateForm = () => {
    if (!email.trim() || !password) {
      setError('Please fill in email and password.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 1. Call Signup API (which automatically generates and sends OTP)
      await signupUser({
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
      });

      // 2. Navigate to OTP verification screen
      navigation.navigate('VerifyOtp', {
        email: email.trim(),
        password,
      });
    } catch (err) {
      console.error('Signup error:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          setError(detail);
        } else if (Array.isArray(detail)) {
          setError(detail.map((d) => d.msg).join(', '));
        } else {
          setError('Failed to create account. Please try again.');
        }
      } else {
        setError('Network error or server unavailable. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundGlow>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 20, 36),
              paddingBottom: Math.max(insets.bottom + 24, 32),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.responsiveWrapper}>
            {/* Header branding */}
            <View style={styles.brandContainer}>
              <View style={styles.badge}>
                <Ionicons name="sparkles" size={12} color={tokens.colors.accentLight} />
                <Text style={styles.badgeText}>GET STARTED</Text>
              </View>
              <Text style={styles.brandTitle}>Create Account</Text>
              <Text style={styles.brandSubtitle}>
                Join in seconds to track expenses and scan receipts with AI
              </Text>
            </View>

            {/* Signup Glass Card */}
            <GlassCard variant="elevated" style={styles.card}>
              {/* Error Banner */}
              {error ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={tokens.colors.dangerLight} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <GlassInput
                label="Full Name"
                placeholder="e.g. Alex Morgan"
                value={fullName}
                onChangeText={(val) => {
                  setFullName(val);
                  if (error) setError('');
                }}
                icon="person-outline"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailInputRef.current?.focus()}
              />

              <GlassInput
                ref={emailInputRef}
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (error) setError('');
                }}
                icon="mail-outline"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                required
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />

              <GlassInput
                ref={passwordInputRef}
                label="Password"
                placeholder="Min. 6 characters"
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (error) setError('');
                }}
                icon="lock-closed-outline"
                secureTextEntry
                required
                helperText="Must contain at least 6 characters"
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
              />

              <GlassInput
                ref={confirmPasswordInputRef}
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (error) setError('');
                }}
                icon="shield-checkmark-outline"
                secureTextEntry
                required
                returnKeyType="done"
                onSubmitEditing={handleSignup}
              />

              <GlassButton
                title="Create Account"
                onPress={handleSignup}
                loading={loading}
                variant="primary"
                size="lg"
                icon="arrow-forward"
                iconPosition="right"
                style={styles.submitButton}
              />
            </GlassCard>

            {/* Footer switch to login */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
                style={styles.loginLinkTouchable}
                accessibilityRole="button"
                accessibilityLabel="Navigate to Sign In screen"
              >
                <Text style={styles.loginLink}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundGlow>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.lg,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: tokens.borderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.30)',
    marginBottom: tokens.spacing.xs,
    gap: 6,
  },
  badgeText: {
    color: tokens.colors.accentLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: tokens.colors.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: tokens.colors.textMuted,
    textAlign: 'center',
    marginTop: tokens.spacing.xs,
    maxWidth: 320,
    lineHeight: 19,
  },
  card: {
    padding: tokens.spacing.xl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.dangerGlass,
    borderWidth: 1,
    borderColor: tokens.colors.dangerBorder,
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
    marginBottom: tokens.spacing.md,
    gap: 8,
  },
  errorText: {
    color: tokens.colors.dangerLight,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  submitButton: {
    marginTop: tokens.spacing.sm,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: tokens.spacing.xl,
  },
  footerText: {
    color: tokens.colors.textMuted,
    fontSize: 14,
  },
  loginLinkTouchable: {
    paddingVertical: tokens.spacing.xs,
  },
  loginLink: {
    color: tokens.colors.primaryLight,
    fontSize: 14,
    fontWeight: '700',
  },
});
