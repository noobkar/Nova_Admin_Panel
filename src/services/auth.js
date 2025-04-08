import { api, apiService } from './api';

// Token management for localStorage
const TOKEN_KEY = 'vpn_admin_token';
const REFRESH_TOKEN_KEY = 'vpn_admin_refresh_token';
const TOKEN_EXPIRY_KEY = 'vpn_admin_token_expiry';

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Get refresh token from localStorage
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// Set token in localStorage
export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

// Set refresh token in localStorage
export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
};

// Set token expiry in localStorage
export const setTokenExpiry = (expiresIn) => {
  if (expiresIn) {
    // Calculate expiry time in milliseconds from now
    const expiryTime = new Date().getTime() + expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
};

// Get token expiry from localStorage
export const getTokenExpiry = () => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  return expiry ? parseInt(expiry, 10) : null;
};

// Check if user is authenticated (token exists)
export const isAuthenticated = () => {
  return !!getToken();
};

// Check if token is expired
export const isTokenExpired = () => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  
  // Check if current time is past expiry time
  return new Date().getTime() > expiry;
};

// Clear all auth data from localStorage
export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

// Login with email and password
export const login = async (email, password) => {
  try {
    const response = await apiService.login({ email, password });
    
    if (!response.data || !response.data.token) {
      throw new Error('Invalid response from server');
    }
    
    const { token, refresh_token, user } = response.data;
    
    // Store tokens
    setToken(token);
    if (refresh_token) {
      setRefreshToken(refresh_token);
    }
    // Default token expiry to 1 hour if not provided
    setTokenExpiry(3600);
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Refresh the access token
export const refreshToken = async () => {
  try {
    const refresh_token = getRefreshToken();
    
    if (!refresh_token) {
      throw new Error('No refresh token available');
    }
    
    const response = await apiService.refreshToken(refresh_token);
    
    if (!response.data || !response.data.token) {
      throw new Error('Invalid response from refresh token request');
    }
    
    const { token, refresh_token: new_refresh_token } = response.data;
    
    // Update tokens and expiry
    setToken(token);
    if (new_refresh_token) {
      setRefreshToken(new_refresh_token);
    }
    setTokenExpiry(3600); // Default to 1 hour if not provided
    
    return response.data;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearAuthData();
    throw error;
  }
};

// Logout - clear tokens and call API
export const logout = async () => {
  try {
    // Call the logout API endpoint
    await apiService.logout();
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue with logout even if API call fails
  } finally {
    // Always clear tokens on logout
    clearAuthData();
  }
};

// Initialize auth state from localStorage
export const initializeAuth = () => {
  const token = getToken();
  const isExpired = isTokenExpired();
  
  // If token exists but is expired, try to refresh
  if (token && isExpired) {
    refreshToken().catch(() => {
      // If refresh fails, clear auth data
      clearAuthData();
    });
  }
};

// Call initializeAuth on import
initializeAuth();