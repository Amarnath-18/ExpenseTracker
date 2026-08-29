import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your local machine's IP when testing on a physical device.
// e.g., 'http://192.168.1.100:8000/api/v1'
// Note: localhost / 127.0.0.1 will not work from an Android/iOS emulator bridging.
export const API_BASE_URL = 'http://10.201.40.26:8000/api/v1'; // 10.0.2.2 is typical for Android emulator to host localhost

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Auth Token & Log Requests
apiClient.interceptors.request.use(
  async (config) => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    if (config.data) {
      console.log(`[API Request Data]`, config.data);
    }

    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Log Responses & Errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    console.log(`[API Response Data]`, response.data);
    return response;
  },
  async (error) => {
    console.error(`[API Response Error]`, error.message);
    if (error.response) {
      console.error(`[API Error Data] Status: ${error.response.status}`, error.response.data);
    }
    
    const originalRequest = error.config;
    
    // If the error is 401 Unauthorized, and we haven't already retried this request
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) {
          // If we don't have a refresh token, we can't do anything
          return Promise.reject(error);
        }
        
        console.log('[API Refreshing Token] Triggering background refresh...');
        
        // Make the refresh request manually to avoid interceptor loops
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, null, {
          headers: {
            'Cookie': `refresh_token=${refreshToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const newAccessToken = refreshResponse.data.access_token;
        const newRefreshToken = refreshResponse.data.refresh_token;
        
        // Save the new tokens securely
        await SecureStore.setItemAsync('userToken', newAccessToken);
        await SecureStore.setItemAsync('refreshToken', newRefreshToken);
        
        console.log('[API Refreshing Token] Success! Retrying original request.');
        
        // Update the original failed request with the new token and retry it
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        console.error('[API Refresh Token Failed]', refreshError);
        // The refresh token is invalid or expired. We should ideally sign out here.
        // For now, we clear the tokens to force a login next time.
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('refreshToken');
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
