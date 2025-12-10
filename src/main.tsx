import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
// @ts-ignore
import 'swiper/css'
// @ts-ignore
import 'swiper/css/pagination'
import App from './App.tsx'
import Login from './pages/Login.tsx'
import Profile from './pages/Profile.tsx'
import UserProfile from './pages/UserProfile.tsx'
import Help from './pages/Help.tsx'
import Feedback from './pages/Feedback.tsx'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'

// 登录页路由守卫（已登录则重定向到首页）
const LoginGuard = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <Login />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginGuard />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user/:userId" 
            element={
              <ProtectedRoute>
                <UserProfile viewMode="other" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/help" 
            element={
              <ProtectedRoute>
                <Help />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/feedback" 
            element={
              <ProtectedRoute>
                <Feedback />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)
