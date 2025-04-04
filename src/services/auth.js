import { api, setAuthToken, removeAuthToken } from './api';

// Mock data for local development
const MOCK_AUTH = {
  access_token: 'mock-access-token-12345',
  refresh_token: 'mock-refresh-token-67890',
  expires_in: 3600 // 1 hour
};

// Check if we should use mock data
const useMockData = false; // Set to false to use real API

// Token management for localStorage
export const TOKEN_KEY = 'vpn_admin_token';
export const REFRESH_TOKEN_KEY = 'vpn_admin_refresh_token';

// Get token from localStorage
export const getToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  console.log('[auth.js] getToken called, token exists:', !!token);
  return token;
};

// Get refresh token from localStorage
export const getRefreshToken = () => {
  const token = localStorage.getItem(REFRESH_TOKEN_KEY);
  console.log('[auth.js] getRefreshToken called, refresh token exists:', !!token);
  return token;
};

// Set token in localStorage and axios headers
export const setToken = (token) => {
  console.log('[auth.js] setToken called with token:', token ? '(exists)' : '(none)');
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    console.log('[auth.js] Token saved to localStorage and set in API');
  }
};

// Set refresh token in localStorage
export const setRefreshToken = (token) => {
  console.log('[auth.js] setRefreshToken called with token:', token ? '(exists)' : '(none)');
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    console.log('[auth.js] Refresh token saved to localStorage');
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const hasToken = !!getToken();
  console.log('[auth.js] isAuthenticated called, result:', hasToken);
  return hasToken;
};

// Clear tokens from localStorage
export const clearTokens = () => {
  console.log('[auth.js] clearTokens called');
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  removeAuthToken();
  console.log('[auth.js] Tokens cleared from localStorage and API');
};

// Login
export const login = async (email, password) => {
  console.log('[auth.js] login called with email:', email);
  
  if (useMockData) {
    console.log('[auth.js] Using mock data for login');
    // Mock successful login for demo
    // In a real app you would validate credentials
    if (email && password) {
      // Store the mock tokens
      console.log('[auth.js] Setting mock tokens');
      setToken(MOCK_AUTH.access_token);
      setRefreshToken(MOCK_AUTH.refresh_token);
      return MOCK_AUTH;
    } else {
      console.log('[auth.js] Mock login failed: Invalid credentials');
      throw new Error('Invalid credentials');
    }
  }

  try {
    console.log('[auth.js] Making real API login request to:', '/admin/login');
    console.log('[auth.js] Request payload:', { email, password: '(hidden)' });
    
    const response = await api.post('/admin/login', { email, password });
    console.log('[auth.js] Login API response status:', response.status);
    console.log('[auth.js] Login API response data:', response.data);
    
    const data = response.data;
    
    // Handle API response structure - may use token instead of access_token
    const accessToken = data.access_token || data.token;
    const refreshToken = data.refresh_token;
    const expiresIn = data.expires_in || 3600; // Default to 1 hour if not provided
    
    // Store tokens in localStorage and set for API calls
    if (accessToken) {
      console.log('[auth.js] Setting tokens from API response');
      setToken(accessToken);
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }
      
      // Return response in expected format
      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
        user: data.user
      };
    } else {
      console.log('[auth.js] API response missing tokens');
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('[auth.js] Login API error:', error);
    console.error('[auth.js] Error response:', error.response?.data);
    console.error('[auth.js] Error status:', error.response?.status);
    throw error;
  }
};

// Refresh token
export const refreshToken = async () => {
  console.log('[auth.js] refreshToken called');
  const currentRefreshToken = getRefreshToken();
  
  if (!currentRefreshToken) {
    console.log('[auth.js] No refresh token available');
    throw new Error('No refresh token available');
  }
  
  if (useMockData) {
    console.log('[auth.js] Using mock data for token refresh');
    // Just return a new mock token
    setToken(MOCK_AUTH.access_token);
    return MOCK_AUTH;
  }

  try {
    console.log('[auth.js] Making real API refresh request');
    const response = await api.post('/admin/refresh', { refresh_token: currentRefreshToken });
    console.log('[auth.js] Refresh API response:', response.data);
    
    const data = response.data;
    
    // Handle API response structure - may use token instead of access_token
    const accessToken = data.access_token || data.token;
    const refreshToken = data.refresh_token;
    const expiresIn = data.expires_in || 3600; // Default to 1 hour if not provided
    
    if (accessToken) {
      console.log('[auth.js] Setting new tokens from refresh response');
      setToken(accessToken);
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }
      
      // Return response in expected format
      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn
      };
    } else {
      console.log('[auth.js] Refresh API response missing tokens');
      throw new Error('Invalid refresh response format');
    }
  } catch (error) {
    console.error('[auth.js] Refresh token API error:', error);
    // If refresh fails, clear tokens and force re-login
    clearTokens();
    throw error;
  }
};

// Logout
export const logout = async () => {
  console.log('[auth.js] logout called');
  const token = getToken();
  
  if (useMockData) {
    console.log('[auth.js] Using mock data for logout');
    // Clear tokens on logout
    clearTokens();
    return { status: 'success' };
  }

  try {
    // Set token for the logout request
    console.log('[auth.js] Making real API logout request');
    setAuthToken(token);
    const response = await api.post('/admin/logout');
    console.log('[auth.js] Logout API response:', response.data);
    
    // Clear tokens after successful logout
    clearTokens();
    return response.data;
  } catch (error) {
    console.error('[auth.js] Logout API error:', error);
    // Clear tokens even if logout API fails
    clearTokens();
    throw error;
  }
};
