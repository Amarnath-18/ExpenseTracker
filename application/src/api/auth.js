import apiClient from './client';

/**
 * Register a new user account
 * @param {Object} data
 * @param {string} data.email
 * @param {string} data.password
 * @param {string} [data.full_name]
 * @returns {Promise<Object>} Created user profile
 */
export const signupUser = async ({ email, password, full_name }) => {
  const payload = {
    email: email.trim(),
    password,
    ...(full_name && full_name.trim() ? { full_name: full_name.trim() } : {}),
  };
  const response = await apiClient.post('/auth/signup', payload);
  return response.data;
};

/**
 * Log in an existing user
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<Object>} { access_token, refresh_token, token_type }
 */
export const loginUser = async ({ email, password }) => {
  const payload = {
    email: email.trim(),
    password,
  };
  const response = await apiClient.post('/auth/login', payload);
  return response.data;
};

/**
 * Log out user session
 * @returns {Promise<Object>}
 */
export const logoutUser = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

/**
 * Send or resend verification OTP to email
 * @param {Object} data
 * @param {string} data.email
 * @returns {Promise<Object>} { success, message }
 */
export const sendOtp = async ({ email }) => {
  const response = await apiClient.post('/auth/send-otp', {
    email: email.trim(),
  });
  return response.data;
};

/**
 * Verify email address with 6-digit OTP
 * @param {Object} data
 * @param {string} data.email
 * @param {string} data.otp
 * @returns {Promise<Object>} { success, message }
 */
export const verifyOtp = async ({ email, otp }) => {
  const response = await apiClient.post('/auth/verify-otp', {
    email: email.trim(),
    otp: otp.trim(),
  });
  return response.data;
};

/**
 * Request OTP for password reset
 * @param {Object} data
 * @param {string} data.email
 * @returns {Promise<Object>} { success, message }
 */
export const forgotPassword = async ({ email }) => {
  const response = await apiClient.post('/auth/forgot-password', {
    email: email.trim(),
  });
  return response.data;
};

/**
 * Reset password using OTP
 * @param {Object} data
 * @param {string} data.email
 * @param {string} data.otp
 * @param {string} data.new_password
 * @returns {Promise<Object>} { success, message }
 */
export const resetPassword = async ({ email, otp, new_password }) => {
  const response = await apiClient.post('/auth/reset-password', {
    email: email.trim(),
    otp: otp.trim(),
    new_password,
  });
  return response.data;
};
