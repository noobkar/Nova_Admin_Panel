import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Sun, Moon, ChevronLeft } from 'react-feather';
import { useTheme } from '../../../hooks/useTheme';
import { useNavigation } from '../../../hooks/useNavigation';
import './Header.scss';

export const Header = () => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { canGoBack, goBack } = useNavigation();
  
  // Get page title based on current path
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/users')) return 'User Management';
    if (path.startsWith('/servers')) return 'Server Management';
    if (path.startsWith('/server-assignments')) return 'Server Assignments';
    if (path.startsWith('/affiliates')) return 'Affiliate Management';
    if (path.startsWith('/commissions')) return 'Commission Management';
    if (path.startsWith('/withdrawals')) return 'Withdrawal Requests';
    if (path.startsWith('/settings')) return 'Settings';
    if (path === '/login') return 'Login';
    
    return 'Dashboard';
  };

  return (
    <header className="header">
      <div className="header__left">
        {canGoBack && (
          <button 
            className="header__back-button"
            onClick={goBack}
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <h1 className="header__title">{getPageTitle()}</h1>
        <p className="header__subtitle">Welcome back, Admin</p>
      </div>
      
      <div className="header__right">
        <div className="header__search">
          <Search size={18} className="header__search-icon" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="header__search-input" 
          />
        </div>
        
        <button 
          className="header__notification"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="header__notification-indicator"></span>
        </button>
        
        <button 
          className="header__theme-toggle"
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};
