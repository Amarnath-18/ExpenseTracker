import React, { useState, useEffect, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ScanReceiptScreen from './src/screens/ScanReceiptScreen';
import TransactionDetailScreen from './src/screens/TransactionDetailScreen';
import { theme } from './src/theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export const AuthContext = createContext();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarIconStyle: { display: 'none' },
          tabBarLabelPosition: 'beside-icon',
          tabBarLabelStyle: { fontSize: 16, fontWeight: 'bold' }
        }}
      />
      <Tab.Screen 
        name="Scan Receipt" 
        component={ScanReceiptScreen} 
        options={{
          tabBarIconStyle: { display: 'none' },
          tabBarLabelPosition: 'beside-icon',
          tabBarLabelStyle: { fontSize: 16, fontWeight: 'bold' }
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  // We don't strictly need refreshToken in React state for conditional rendering, but we store it in SecureStore.

  const authContext = React.useMemo(
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
    // Check if token exists
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userToken == null ? (
            // No token found, user isn't signed in
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            // User is signed in
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen 
                name="TransactionDetail" 
                component={TransactionDetailScreen} 
                options={{ presentation: 'modal' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
