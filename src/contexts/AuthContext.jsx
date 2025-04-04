import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  login, 
  refreshToken as refreshTokenService, 
  logout as logoutService,
  isAuthenticated,
  getToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  clearTokens
} from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const navigate = useNavigate();

  console.log('[AuthContext] Initializing AuthProvider');

  // Load user from localStorage on mount
  useEffect(() => {
    console.log('[AuthContext] Checking for stored user data');
    const storedUser = localStorage.getItem('user');
    const isAuth = isAuthenticated();
    console.log('[AuthContext] isAuthenticated:', isAuth);
    
    if (storedUser && isAuth) {
      console.log('[AuthContext] Found stored user, setting as current user');
      setCurrentUser(JSON.parse(storedUser));
    } else {
      console.log('[AuthContext] No valid stored user found');
    }
    
    setLoading(false);
  }, []);

  // Login function
  const loginUser = async (email, password) => {
    console.log('[AuthContext] loginUser called with email:', email);
    setLoading(true);
    setError(null);
    
    try {
      console.log('[AuthContext] Calling login API');
      const response = await login(email, password);
      console.log('[AuthContext] Login API response:', response);
      
      if (!response) {
        console.error('[AuthContext] Login API returned empty response');
        setLoading(false);
        setError('Login failed: Empty response from server');
        return false;
      }
      
      console.log('[AuthContext] Checking for access_token in response');
      const { access_token, refresh_token, expires_in, user } = response;
      
      if (!access_token) {
        console.error('[AuthContext] Login API response missing access_token');
        setLoading(false);
        setError('Login failed: Invalid response from server');
        return false;
      }
      
      // User object might come from the API or we create a minimal one
      const userData = user || { email };
      
      // Save to context
      console.log('[AuthContext] Setting currentUser:', userData);
      setCurrentUser(userData);
      
      // Save user to localStorage
      console.log('[AuthContext] Saving user to localStorage');
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Save token expiry time
      console.log('[AuthContext] Setting token expiry');
      const expiryTime = new Date().getTime() + expires_in * 1000;
      localStorage.setItem('tokenExpiry', expiryTime);
      setTokenExpiry(expiryTime);
      
      setLoading(false);
      
      // Navigate to dashboard after successful login
      console.log('[AuthContext] Navigation to dashboard');
      navigate('/dashboard');
      
      return true;
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      console.error('[AuthContext] Error details:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Login failed');
      setLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    console.log('[AuthContext] logout called');
    try {
      await logoutService();
      console.log('[AuthContext] Logout service completed');
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
    } finally {
      console.log('[AuthContext] Clearing user data and redirecting to login');
      setCurrentUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiry');
      setTokenExpiry(null);
      navigate('/login');
    }
  };

  // Token refresh function
  const refresh = async () => {
    console.log('[AuthContext] refresh called');
    const refreshToken = getRefreshToken();
    console.log('[AuthContext] Refresh token exists:', !!refreshToken);
    
    if (!refreshToken) {
      console.log('[AuthContext] No refresh token, logging out');
      logout();
      return false;
    }
    
    try {
      console.log('[AuthContext] Calling refresh token API');
      const response = await refreshTokenService();
      console.log('[AuthContext] Refresh token response:', response);
      
      const { access_token, refresh_token, expires_in } = response;
      
      // Save token expiry time
      console.log('[AuthContext] Updating token expiry');
      const expiryTime = new Date().getTime() + expires_in * 1000;
      localStorage.setItem('tokenExpiry', expiryTime);
      setTokenExpiry(expiryTime);
      
      return true;
    } catch (err) {
      console.error('[AuthContext] Token refresh error:', err);
      logout();
      return false;
    }
  };

  // Check if token needs refresh
  const checkAndRefreshToken = () => {
    console.log('[AuthContext] Checking if token needs refresh');
    const expiryTime = localStorage.getItem('tokenExpiry');
    
    if (!expiryTime) {
      console.log('[AuthContext] No expiry time found');
      return;
    }
    
    // Refresh when less than 5 minutes remaining
    const shouldRefresh = new Date().getTime() > (parseInt(expiryTime) - 5 * 60 * 1000);
    console.log('[AuthContext] Should refresh token:', shouldRefresh);
    
    if (shouldRefresh) {
      console.log('[AuthContext] Refreshing token');
      refresh();
    }
  };

  // Set up token refresh check
  useEffect(() => {
    if (!isAuthenticated()) {
      console.log('[AuthContext] Not authenticated, skipping token refresh setup');
      return;
    }
    
    console.log('[AuthContext] Setting up token refresh');
    // Check token on mount
    checkAndRefreshToken();
    
    // Set interval to check token
    const interval = setInterval(checkAndRefreshToken, 60 * 1000); // Check every minute
    console.log('[AuthContext] Token refresh interval set');
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    loginUser,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
