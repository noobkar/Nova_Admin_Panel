import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { api } from '../services/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { refresh } = useAuth();

  const callApi = useCallback(async (method, url, data = null, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api[method](url, data, options);
      setLoading(false);
      return response.data;
    } catch (err) {
      // If the error is due to an expired token (401), try to refresh the token
      if (err.response?.status === 401) {
        const refreshSuccess = await refresh();
        
        if (refreshSuccess) {
          // Retry the original request
          try {
            const retryResponse = await api[method](url, data, options);
            setLoading(false);
            return retryResponse.data;
          } catch (retryErr) {
            setError(retryErr.response?.data?.message || 'API request failed');
            setLoading(false);
            throw retryErr;
          }
        }
      }
      
      setError(err.response?.data?.message || 'API request failed');
      setLoading(false);
      throw err;
    }
  }, [refresh]);

  // Create convenience methods for common HTTP methods
  const get = useCallback((url, options) => callApi('get', url, null, options), [callApi]);
  const post = useCallback((url, data, options) => callApi('post', url, data, options), [callApi]);
  const put = useCallback((url, data, options) => callApi('put', url, data, options), [callApi]);
  const del = useCallback((url, options) => callApi('delete', url, null, options), [callApi]);
  
  return {
    loading,
    error,
    callApi,
    get,
    post,
    put,
    delete: del,
  };
};
