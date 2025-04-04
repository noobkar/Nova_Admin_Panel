import { Navigate } from 'react-router-dom';
import { Login } from './pages/Login/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { UserManagement } from './pages/UserManagement/UserManagement';
import { ServerManagement } from './pages/ServerManagement/ServerManagement';
import { ServerAssignment } from './pages/ServerAssignment/ServerAssignment';
import { AffiliateManagement } from './pages/AffiliateManagement/AffiliateManagement';
import { CommissionManagement } from './pages/CommissionManagement/CommissionManagement';
import { WithdrawalManagement } from './pages/WithdrawalManagement/WithdrawalManagement';
import { MainLayout } from './layouts/MainLayout';
import { isAuthenticated } from './services/auth';

// Protected route wrapper component
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public route wrapper component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Define routes
export const routes = [
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <UserManagement />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/servers',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <ServerManagement />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/server-assignments',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <ServerAssignment />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/affiliates',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <AffiliateManagement />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/commissions',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <CommissionManagement />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/withdrawals',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <WithdrawalManagement />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  // Catch all route for 404 - redirect to login
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
];
