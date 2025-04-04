import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar/Sidebar';
import { Header } from '../components/common/Header/Header';
import './MainLayout.scss';

export const MainLayout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // Don't render sidebar and header on the login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-layout__content">
        <Header />
        <main className="main-layout__main">
          {children}
        </main>
      </div>
    </div>
  );
};
