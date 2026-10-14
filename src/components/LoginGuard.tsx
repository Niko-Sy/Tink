import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Login from '../pages/Login';
export default function LoginGuard() { const { isAuthenticated, loading } = useAuth(); if (loading) return <p role="status">正在恢复登录状态…</p>; return isAuthenticated ? <Navigate to="/" replace /> : <Login />; }
