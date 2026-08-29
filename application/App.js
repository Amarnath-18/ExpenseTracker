import React, { useState, useEffect, createContext, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import VerifyOtpScreen from './src/screens/VerifyOtpScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import ScanReceiptScreen from './src/screens/ScanReceiptScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';
import tokens from './src/theme/tokens';
import BackgroundGlow from './src/components/BackgroundGlow';

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
              name={focused ? 'pie-chart' : 'pie-chart-outline'}
              size={22}
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
              size={24}
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

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

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

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={authContext}>
        <StatusBar style="light" />
        {isLoading ? (
          <BackgroundGlow style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
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
