import React, { createContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const NavigationContext = createContext({
  navigationStack: [],
  navigateTo: () => {},
  goBack: () => {},
  navigateBack: () => {},
  clearNavigationStack: () => {},
  canGoBack: false,
  currentPage: '',
  setCurrentPage: () => {}
});

export const NavigationProvider = ({ children }) => {
  const [navigationStack, setNavigationStack] = useState([]);
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const navigate = useNavigate();
  const location = useLocation();

  // Keep track of history
  useEffect(() => {
    // Don't record initial load
    if (navigationStack.length === 0) return;
    
    // Don't add duplicates
    const lastPath = navigationStack[navigationStack.length - 1];
    if (lastPath === location.pathname) return;
    
  }, [location.pathname]);

  // Add current route to navigation stack when navigating to a new route
  const navigateTo = useCallback((path, options = {}) => {
    if (location.pathname !== path) {
      // Only add to stack if it's a different route
      setNavigationStack(prev => [...prev, location.pathname]);
      navigate(path, options);
    }
  }, [location.pathname, navigate]);

  // Go back in the navigation stack
  const goBack = useCallback(() => {
    if (navigationStack.length > 0) {
      const prevPath = navigationStack[navigationStack.length - 1];
      setNavigationStack(prev => prev.slice(0, -1));
      navigate(prevPath);
      return true;
    } else {
      // If no previous routes in stack, navigate to dashboard
      navigate('/dashboard');
      return false;
    }
  }, [navigationStack, navigate]);
  
  // Alias for goBack for backward compatibility
  const navigateBack = useCallback(() => {
    return goBack();
  }, [goBack]);

  // Clear navigation stack (e.g., on logout)
  const clearNavigationStack = useCallback(() => {
    setNavigationStack([]);
  }, []);

  const value = {
    navigationStack,
    currentPage,
    setCurrentPage,
    navigateTo,
    goBack,
    navigateBack,
    clearNavigationStack,
    canGoBack: navigationStack.length > 0,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};
