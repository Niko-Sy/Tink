import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-ground text-white flex items-center justify-center" role="status">正在恢复登录状态…</div>;

  if (!isAuthenticated) {
    // 如果未登录，重定向到登录页
    return <Navigate to="/login" replace />;
  }

  // 如果已登录，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute;
