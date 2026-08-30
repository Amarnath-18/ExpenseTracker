import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';
import BackgroundGlow from '../components/BackgroundGlow';
import GlassCard from '../components/GlassCard';
import tokens from '../theme/tokens';
import { resetPassword } from '../api/auth';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email || '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email, otp, new_password: newPassword });
      setSuccess(true);
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to reset password. Please check your OTP and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <BackgroundGlow style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color={tokens.colors.successLight} />
          </View>
          <Text style={styles.title}>Password Reset!</Text>
          <Text style={styles.subtitle}>
            Your password has been changed successfully. You can now log in with your new password.
          </Text>
          <GlassButton
            title="Go to Login"
            onPress={() => navigation.navigate('Login')}
            style={styles.submitBtn}
            variant="emerald"
          />
        </View>
      </BackgroundGlow>
    );
  }

  return (
    <BackgroundGlow style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="key" size={32} color={tokens.colors.primaryLight} />
              </View>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                We've sent a 6-digit code to {email}. Enter it below along with your new password.
              </Text>
            </View>

            <GlassCard style={styles.formCard}>
              <GlassInput
                label="Verification Code (OTP)"
                placeholder="123456"
                icon="keypad-outline"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  setError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                error={error && error.includes('OTP') ? error : ''}
              />

              <GlassInput
                label="New Password"
                placeholder="••••••••"
                icon="lock-closed-outline"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setError('');
                }}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
                error={error && !error.includes('OTP') ? error : ''}
              />

              <GlassButton
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                style={styles.submitBtn}
              />
            </GlassCard>
            
            <View style={styles.footer}>
              <Text
                style={styles.footerLink}
                onPress={() => navigation.navigate('Login')}
              >
                Cancel
              </Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </BackgroundGlow>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: tokens.spacing.xl,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.glassLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.glassBorder,
  },
  title: {
    ...tokens.typography.h1,
    marginBottom: tokens.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...tokens.typography.body,
    textAlign: 'center',
    paddingHorizontal: tokens.spacing.md,
  },
  formCard: {
    marginBottom: tokens.spacing.xl,
  },
  submitBtn: {
    marginTop: tokens.spacing.md,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.xl,
  },
  successIconContainer: {
    marginBottom: tokens.spacing.lg,
  },
  footer: {
    alignItems: 'center',
  },
  footerLink: {
    ...tokens.typography.body,
    color: tokens.colors.textMuted,
    fontWeight: '600',
  },
});
