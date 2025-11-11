import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  userId: string;
  username: string;
  token: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  signature?: string;
  onlineStatus?: 'online' | 'away' | 'busy' | 'offline';
  accountStatus?: 'active' | 'inactive' | 'suspended';
  role?: 'admin' | 'moderator' | 'user';
  loginTime?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: Partial<User> & { username: string; token: string; userId: string }) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // 初始化时从本地存储加载用户信息
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // 登录函数
  const login = (userData: Partial<User> & { username: string; token: string; userId: string }) => {
    const completeUserData: User = {
      userId: userData.userId,
      username: userData.username,
      token: userData.token,
      nickname: userData.nickname || userData.username,
      phone: userData.phone,
      email: userData.email,
      avatar: userData.avatar,
      signature: userData.signature,
      onlineStatus: userData.onlineStatus || 'online',
      accountStatus: userData.accountStatus || 'active',
      role: userData.role || 'user',
      loginTime: new Date().toISOString()
    };
    setUser(completeUserData);
    localStorage.setItem('user', JSON.stringify(completeUserData));
  };

  // 登出函数
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
