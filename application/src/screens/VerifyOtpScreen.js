import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { verifyOtp, sendOtp, loginUser } from '../api/auth';
import tokens from '../theme/tokens';
import { AuthContext } from '../../App';
import BackgroundGlow from '../components/BackgroundGlow';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';

export default function VerifyOtpScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { email = '', password = '' } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [cooldown, setCooldown] = useState(60);

  const inputRef = useRef(null);
  const { signIn } = useContext(AuthContext);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    setError('');
    setInfoMessage('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      await verifyOtp({ email, otp: cleanOtp });

      // If user came from signup with password, log them in automatically
      if (password) {
        const tokenData = await loginUser({ email, password });
        signIn(tokenData.access_token, tokenData.refresh_token);
      } else {
        navigation.navigate('Login');
      }
    } catch (err) {
      console.error('OTP Verification error:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        setError(typeof detail === 'string' ? detail : 'Invalid verification code.');
      } else {
        setError('Failed to verify OTP. Please check the code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setError('');
    setInfoMessage('');
    setResending(true);

    try {
      await sendOtp({ email });
      setInfoMessage('A fresh verification code has been sent to your email.');
      setCooldown(60);
    } catch (err) {
      console.error('OTP Resend error:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        setError(typeof detail === 'string' ? detail : 'Unable to resend code right now.');
      } else {
        setError('Failed to resend code. Please try again later.');
      }
    } finally {
      setResending(false);
    }
  };

  // Render 6 individual frosted glass cells for OTP digits
  const renderOtpBoxes = () => {
    const otpDigits = otp.split('');
    const boxes = [];

    for (let i = 0; i < 6; i++) {
      const digit = otpDigits[i] || '';
      const isFocused = otpDigits.length === i;
      const isFilled = Boolean(digit);

      boxes.push(
        <View
          key={i}
          style={[
            styles.otpBox,
            isFocused && styles.otpBoxFocused,
            isFilled && styles.otpBoxFilled,
          ]}
        >
          <Text style={styles.otpDigit}>{digit}</Text>
        </View>
      );
    }

    return boxes;
  };

  return (
    <BackgroundGlow>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 20, 40),
              paddingBottom: Math.max(insets.bottom + 24, 32),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.responsiveWrapper}>
            {/* Header Badge & Title */}
            <View style={styles.headerContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-unread-outline" size={32} color={tokens.colors.primaryLight} />
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>EMAIL VERIFICATION</Text>
              </View>
              <Text style={styles.title}>Enter OTP Code</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit verification code to
              </Text>
              <View style={styles.emailPill}>
                <Ionicons name="mail" size={13} color={tokens.colors.primaryLight} />
                <Text style={styles.emailText}>{email || 'your email address'}</Text>
              </View>
            </View>

            {/* OTP Glass Card */}
            <GlassCard variant="elevated" style={styles.card}>
              {/* Feedback messages */}
              {error ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={tokens.colors.dangerLight} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {infoMessage ? (
                <View style={styles.infoBanner}>
                  <Ionicons name="checkmark-circle" size={18} color={tokens.colors.successLight} />
                  <Text style={styles.infoText}>{infoMessage}</Text>
                </View>
              ) : null}

              {/* 6-Digit Visual Glass Boxes Container with native overlay */}
              <View style={styles.otpBoxesContainer}>
                {renderOtpBoxes()}

                <TextInput
                  ref={inputRef}
                  value={otp}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
                    setOtp(cleaned);
                    if (error) setError('');
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  style={styles.hiddenInput}
                  accessibilityLabel="Enter 6-digit verification code"
                />
              </View>

              <Text style={styles.helperText}>
                Code expires in 5 minutes • Tap boxes to type
              </Text>

              {/* Verify Action Button */}
              <GlassButton
                title="Verify & Continue"
                onPress={handleVerify}
                loading={loading}
                disabled={otp.length !== 6}
                variant="primary"
                size="lg"
                icon="checkmark-done"
                iconPosition="right"
                style={styles.verifyButton}
              />

              {/* Resend Code Button & Timer */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendLabel}>Didn’t receive the code? </Text>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={cooldown > 0 || resending}
                  style={styles.resendTouchable}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.resendButtonText,
                      (cooldown > 0 || resending) && styles.resendDisabled,
                    ]}
                  >
                    {resending
                      ? 'Sending...'
                      : cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Back to login */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Login')}
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={16} color={tokens.colors.textMuted} />
              <Text style={styles.backButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
    ...tokens.shadows.primaryGlow,
  },
  badge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: tokens.borderRadius.round,
    marginBottom: tokens.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  badgeText: {
    color: tokens.colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: tokens.colors.textMuted,
    textAlign: 'center',
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.glassLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: tokens.borderRadius.round,
    marginTop: tokens.spacing.xs,
    borderWidth: 1,
    borderColor: tokens.colors.glassBorder,
    gap: 6,
  },
  emailText: {
    color: tokens.colors.text,
    fontWeight: '600',
    fontSize: 13,
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.successGlass,
    borderWidth: 1,
    borderColor: tokens.colors.successBorder,
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
    marginBottom: tokens.spacing.md,
    gap: 8,
  },
  infoText: {
    color: tokens.colors.successLight,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: tokens.spacing.md,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.glassInput,
    borderWidth: 1.5,
    borderColor: tokens.colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFocused: {
    borderColor: tokens.colors.primaryLight,
    backgroundColor: 'rgba(23, 32, 54, 0.85)',
    ...tokens.shadows.primaryGlow,
  },
  otpBoxFilled: {
    borderColor: tokens.colors.glassBorderHighlight,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  helperText: {
    color: tokens.colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: tokens.spacing.lg,
  },
  verifyButton: {
    marginBottom: tokens.spacing.md,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: tokens.spacing.sm,
  },
  resendLabel: {
    color: tokens.colors.textMuted,
    fontSize: 13,
  },
  resendTouchable: {
    paddingVertical: 4,
  },
  resendButtonText: {
    color: tokens.colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  resendDisabled: {
    color: tokens.colors.textDim,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.spacing.lg,
    gap: 6,
  },
  backButtonText: {
    color: tokens.colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
