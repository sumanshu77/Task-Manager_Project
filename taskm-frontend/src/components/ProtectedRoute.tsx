import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { state } = useAuth();

  // if auth isn't initialized yet (refresh in progress), show a loading placeholder
  if (!state.initialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!state.user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && state.user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};