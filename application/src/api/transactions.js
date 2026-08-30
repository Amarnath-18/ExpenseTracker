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
 * Update an existing transaction
 * @param {string} transactionId - UUID of the transaction
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const updateTransaction = async (transactionId, payload) => {
  const response = await apiClient.put(`/transactions/${transactionId}`, payload);
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

/**
 * Upload a transaction receipt image for async processing
 * @param {string} uri - URI of the image file
 * @param {string} mimeType - MIME type of the file
 * @param {string} fileName - File name
 * @returns {Promise<Object>} { message: string, job_id: string }
 */
export const uploadReceiptAsync = async (uri, mimeType = 'image/jpeg', fileName = 'receipt.jpg') => {
  const formData = new FormData();
  formData.append('file', {
    uri: uri,
    name: fileName,
    type: mimeType,
  });
  
  const response = await apiClient.post('/transactions/upload/async', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Check the status of an async upload job
 * @param {string} jobId
 * @returns {Promise<Object>}
 */
export const checkJobStatus = async (jobId) => {
  const response = await apiClient.get(`/transactions/jobs/${jobId}`);
  return response.data;
};
