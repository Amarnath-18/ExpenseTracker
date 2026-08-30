import React, { useState, useContext, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';

import { loginUser } from '../api/auth';
import { AuthContext } from '../../App';
import tokens from '../theme/tokens';
import BackgroundGlow from '../components/BackgroundGlow';
import GlassCard from '../components/GlassCard';
import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordInputRef = useRef(null);
  const { signIn } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await loginUser({
        email: email.trim(),
        password,
      });

      const token = data.access_token;
      const refreshToken = data.refresh_token;

      signIn(token, refreshToken);
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        setError(typeof detail === 'string' ? detail : 'Invalid credentials.');
      } else {
        setError('Invalid email or password. Please try again.');
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
              paddingTop: Math.max(insets.top + 20, 40),
              paddingBottom: Math.max(insets.bottom + 24, 32),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.responsiveWrapper}>
            {/* App Brand & Header */}
            <View style={styles.brandContainer}>
              <View style={styles.logoRing}>
                <LinearGradient
                  colors={tokens.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoGradient}
                >
                  <Ionicons name="wallet" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>

              <Text style={styles.brandTitle}>SpendPulse</Text>
              <Text style={styles.brandSubtitle}>
                Smart financial tracking & instant receipt intelligence
              </Text>
            </View>

            {/* Glass Login Card */}
            <GlassCard variant="elevated" style={styles.card}>
              <Text style={styles.cardHeading}>Sign In</Text>
              <Text style={styles.cardSubheading}>
                Enter your credentials to manage your expenses
              </Text>

              {/* Error Feedback */}
              {error ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={tokens.colors.dangerLight} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Inputs */}
              <GlassInput
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
                placeholder="••••••••"
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (error) setError('');
                }}
                icon="lock-closed-outline"
                secureTextEntry
                required
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <GlassButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                variant="primary"
                size="lg"
                icon="arrow-forward"
                iconPosition="right"
                style={styles.submitButton}
              />
            </GlassCard>

            {/* Footer / Switch Auth Link */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don’t have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Signup')}
                activeOpacity={0.7}
                style={styles.signupLinkTouchable}
                accessibilityRole="button"
                accessibilityLabel="Navigate to Create Account screen"
              >
                <Text style={styles.signupLink}> Create Account</Text>
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
    maxWidth: 440,
    alignSelf: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  logoRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
    ...tokens.shadows.primaryGlow,
  },
  logoGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: tokens.colors.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: tokens.colors.textMuted,
    textAlign: 'center',
    marginTop: tokens.spacing.xs,
    maxWidth: 290,
    lineHeight: 20,
  },
  card: {
    padding: tokens.spacing.xl,
  },
  cardHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: tokens.colors.text,
    letterSpacing: -0.3,
  },
  cardSubheading: {
    fontSize: 13,
    color: tokens.colors.textMuted,
    marginTop: 4,
    marginBottom: tokens.spacing.lg,
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: tokens.spacing.sm,
  },
  forgotPasswordText: {
    color: tokens.colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
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
  signupLinkTouchable: {
    paddingVertical: tokens.spacing.xs,
  },
  signupLink: {
    color: tokens.colors.primaryLight,
    fontSize: 14,
    fontWeight: '700',
  },
});
