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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';
import BackgroundGlow from '../components/BackgroundGlow';
import GlassCard from '../components/GlassCard';
import tokens from '../theme/tokens';
import { forgotPassword } from '../api/auth';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (val) => {
    const regex = /^\S+@\S+\.\S+$/;
    return regex.test(val);
  };

  const handleRequestOtp = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
      navigation.navigate('ResetPassword', { email: email.trim() });
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Unable to request password reset. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

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
                <Ionicons name="lock-closed" size={32} color={tokens.colors.primaryLight} />
              </View>
              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.subtitle}>
                Enter your email address and we'll send you an OTP to reset your password.
              </Text>
            </View>

            <GlassCard style={styles.formCard}>
              <GlassInput
                label="Email Address"
                placeholder="you@example.com"
                icon="mail-outline"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={error}
                returnKeyType="send"
                onSubmitEditing={handleRequestOtp}
              />

              <GlassButton
                title="Send OTP"
                onPress={handleRequestOtp}
                loading={loading}
                style={styles.submitBtn}
                icon="arrow-forward"
                iconPosition="right"
              />
            </GlassCard>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <Text
                style={styles.footerLink}
                onPress={() => navigation.navigate('Login')}
              >
                Log In
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
    marginTop: tokens.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...tokens.typography.body,
    color: tokens.colors.textMuted,
  },
  footerLink: {
    ...tokens.typography.body,
    color: tokens.colors.primaryLight,
    fontWeight: '700',
  },
});
