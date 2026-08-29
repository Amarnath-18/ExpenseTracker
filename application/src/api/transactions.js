import apiClient from './client';

/**
 * Fetch all stored transactions for the authenticated user
 * @returns {Promise<Object>} { items: Array, total: number }
 */
export const getTransactions = async () => {
  const response = await apiClient.get('/transactions/');
  return response.data;
};

/**
 * Delete a transaction by its ID
 * @param {string} transactionId - UUID of the transaction
 * @returns {Promise<Object>} { success: boolean, message: string, id: string }
 */
export const deleteTransaction = async (transactionId) => {
  const response = await apiClient.delete(`/transactions/${transactionId}`);
  return response.data;
};

/**
 * Create a transaction manually
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const createTransaction = async (payload) => {
  const response = await apiClient.post('/transactions/', payload);
  return response.data;
};
