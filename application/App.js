import React, { useState, useEffect, createContext, useMemo, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View, StyleSheet, Platform, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import VerifyOtpScreen from './src/screens/VerifyOtpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import ScanReceiptScreen from './src/screens/ScanReceiptScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';
import tokens from './src/theme/tokens';
import BackgroundGlow from './src/components/BackgroundGlow';
import { useShareIntent } from 'expo-share-intent';
import { uploadReceiptAsync } from './src/api/transactions';
import { ModalProvider, useModal } from './src/contexts/ModalContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export const AuthContext = createContext({
  signIn: async () => {},
  signOut: async () => {},
});

function CustomTabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={tokens.blurIntensity}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />
    );
  }
  return <View style={styles.androidTabBarBackground} />;
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarBackground: CustomTabBarBackground,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(15, 23, 42, 0.95)',
          borderTopColor: tokens.colors.glassBorder,
          borderTopWidth: 1,
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 12,
        },
        tabBarActiveTintColor: tokens.colors.primaryLight,
        tabBarInactiveTintColor: tokens.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={20}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={21}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Add Expense"
        component={AddTransactionScreen}
        options={{
          tabBarLabel: 'Add Expense',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Scan Receipt"
        component={ScanReceiptScreen}
        options={{
          tabBarLabel: 'Scan Receipt',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'scan-circle' : 'scan-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RootApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [isUploadingShared, setIsUploadingShared] = useState(false);
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const { showModal } = useModal();

  const isProcessingShareIntent = useRef(false);

  const authContext = useMemo(
    () => ({
      signIn: async (token, refreshToken) => {
        setUserToken(token);
        await SecureStore.setItemAsync('userToken', token);
        if (refreshToken) {
          await SecureStore.setItemAsync('refreshToken', refreshToken);
        }
      },
      signOut: async () => {
        setUserToken(null);
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('refreshToken');
      },
    }),
    []
  );

  useEffect(() => {
    // Check if token exists on mount
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          setUserToken(token);
        }
      } catch (e) {
        console.error('Failed to get token', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, []);

  useEffect(() => {
    const handleShareIntent = async () => {
      if (!hasShareIntent || isLoading) return;
      
      // Prevent double execution race condition
      if (isProcessingShareIntent.current) return;
      isProcessingShareIntent.current = true;

      if (!userToken) {
        showModal({
          title: 'Login Required',
          message: 'You must be logged in to upload shared images.',
          type: 'error',
        });
        resetShareIntent();
        isProcessingShareIntent.current = false;
        return;
      }

      const sharedFile =
        (shareIntent?.files && shareIntent.files[0]) ||
        (Array.isArray(shareIntent?.value) && shareIntent.value[0]) ||
        (shareIntent?.value && typeof shareIntent.value === 'object' ? shareIntent.value : null);

      const uri =
        sharedFile?.contentUri ||
        sharedFile?.path ||
        (typeof shareIntent?.value === 'string' &&
        (shareIntent.value.startsWith('file://') || shareIntent.value.startsWith('content://'))
          ? shareIntent.value
          : null);

      if (uri) {
        try {
          setIsUploadingShared(true);
          const mimeType = sharedFile?.mimeType || 'image/jpeg';
          const fileName = sharedFile?.fileName || `shared_receipt_${Date.now()}.jpg`;

          await uploadReceiptAsync(uri, mimeType, fileName);
          showModal({
            title: 'Success',
            message: 'Shared image uploaded successfully and is being processed.',
            type: 'success',
          });
        } catch (error) {
          showModal({
            title: 'Upload Failed',
            message: 'Failed to upload the shared image.',
            type: 'error',
          });
          console.error('Share upload error:', error);
        } finally {
          setIsUploadingShared(false);
          resetShareIntent();
          // Short delay before unlocking to ensure state updates propagate
          setTimeout(() => {
            isProcessingShareIntent.current = false;
          }, 500);
        }
      } else {
        resetShareIntent();
        isProcessingShareIntent.current = false;
      }
    };

    handleShareIntent();
  }, [hasShareIntent, shareIntent, userToken, isLoading]);

  return (
    <AuthContext.Provider value={authContext}>
        <StatusBar style="light" />
        {isLoading || isUploadingShared ? (
          <BackgroundGlow style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
            {isUploadingShared && <Text style={{color: 'white', marginTop: 10}}>Uploading Shared Image...</Text>}
          </BackgroundGlow>
        ) : (
          <NavigationContainer
            theme={{
              dark: true,
              colors: {
                primary: tokens.colors.primary,
                background: tokens.colors.canvas,
                card: tokens.colors.canvasElevated,
                text: tokens.colors.text,
                border: tokens.colors.glassBorder,
                notification: tokens.colors.accent,
              },
            }}
          >
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: tokens.colors.canvas },
                animation: 'fade_from_bottom',
              }}
            >
              {userToken == null ? (
                // Unauthenticated Auth Flow
                <>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Signup" component={SignupScreen} />
                  <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
                  <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                  <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                </>
              ) : (
                // Authenticated App Flow
                <>
                  <Stack.Screen name="Main" component={MainTabs} />
                  <Stack.Screen
                    name="AddTransaction"
                    component={AddTransactionScreen}
                    options={{ presentation: 'modal' }}
                  />
                  <Stack.Screen
                    name="TransactionDetail"
                    component={TransactionDetailScreen}
                    options={{ presentation: 'modal' }}
                  />
                </>
              )}
          </Stack.Navigator>
        </NavigationContainer>
      )}
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ModalProvider>
        <RootApp />
      </ModalProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  androidTabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
  },
});
