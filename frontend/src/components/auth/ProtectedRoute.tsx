import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Please sign in to continue.', variant: 'error' } 
      }));
    } else if (!loading && adminOnly && !isAdmin) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Access denied. Admin only.', variant: 'error' } 
      }));
    }
  }, [loading, user, isAdmin, adminOnly]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/user/login?redirect=${redirectParam}`} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
