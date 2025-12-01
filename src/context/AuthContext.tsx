import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ChatRoomMember, User as UserType } from '../types';
import { 
  authService, 
  userService,
  tokenManager,
  wsClient
} from '../services';
import type { ApiError } from '../services';
import type { LoginRequest, RegisterRequest } from '../services';

// 使用types中的User接口，扩展登录相关字段
interface User extends UserType {
  token?: string;
  loginTime?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  // 登录/注册/登出
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  // 清除错误
  clearError: () => void;
  // 刷新用户信息
  refreshUserInfo: () => Promise<void>;
  isAuthenticated: boolean;
  // 聊天室成员信息管理
  currentRoomMember: ChatRoomMember | null;
  setCurrentRoomMember: (member: ChatRoomMember | null) => void;
  getCurrentRoomMember: (roomId: string) => ChatRoomMember | null;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRoomMember, setCurrentRoomMember] = useState<ChatRoomMember | null>(null);
  const [roomMembers, setRoomMembers] = useState<Record<string, ChatRoomMember>>({});
  
  // 使用 ref 来存储最新的 roomMembers，避免闭包问题
  const roomMembersRef = useRef<Record<string, ChatRoomMember>>({});

  // 同步 ref 和 state
  useEffect(() => {
    roomMembersRef.current = roomMembers;
  }, [roomMembers]);

  // 初始化时从本地存储加载用户信息并验证
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      const storedUser = authService.getStoredUser();
      const token = tokenManager.getToken();
      
      if (storedUser && token) {
        // 检查 Token 是否过期
        if (tokenManager.isTokenExpired()) {
          // 尝试刷新 Token
          try {
            await authService.refreshToken();
            // 刷新成功，获取最新用户信息
            const response = await userService.getCurrentUser();
            if (response.code === 200 && response.data) {
              const userData: User = {
                ...response.data,
                loginTime: (storedUser as User).loginTime,
              };
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
              // 建立 WebSocket 连接
              wsClient.connect();
            }
          } catch {
            // 刷新失败，清除登录状态
            tokenManager.clearAll();
            setUser(null);
          }
        } else {
          // Token 有效，直接使用存储的用户信息
          setUser(storedUser as User);
          // 建立 WebSocket 连接
          wsClient.connect();
        }
      }

      // 加载聊天室成员信息
      const storedMembers = localStorage.getItem('roomMembers');
      if (storedMembers) {
        try {
          const membersData = JSON.parse(storedMembers);
          setRoomMembers(membersData);
        } catch (err) {
          console.error('Failed to parse room members data:', err);
          localStorage.removeItem('roomMembers');
        }
      }
      
      setLoading(false);
    };

    initializeAuth();

    // 组件卸载时断开 WebSocket
    return () => {
      wsClient.disconnect();
    };
  }, []);

  // 登录函数
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      
      if (response.code === 200 && response.data) {
        const { user: userData, token } = response.data;
        
        const completeUserData: User = {
          userId: userData.userId,
          username: userData.username || '',
          name: userData.name || userData.nickname || userData.username || '',
          status: userData.status || 'online',
          avatar: userData.avatar || 'https://ai-public.mastergo.com/ai/img_res/3b71fa6479b687f7aac043084415c2d8.jpg',
          token: token,
          nickname: userData.nickname || userData.username,
          phone: userData.phone,
          email: userData.email,
          signature: userData.signature,
          onlineStatus: userData.onlineStatus || 'online',
          accountStatus: userData.accountStatus || 'active',
          systemRole: userData.systemRole || 'user',
          loginTime: new Date().toISOString(),
          globalMuteStatus: userData.globalMuteStatus || 'unmuted',
          globalMuteEndTime: userData.globalMuteEndTime,
        };
        
        setUser(completeUserData);
        localStorage.setItem('user', JSON.stringify(completeUserData));
        
        // 建立 WebSocket 连接
        wsClient.connect(token);
        
        setLoading(false);
        return true;
      } else {
        setError(response.message || '登录失败');
        setLoading(false);
        return false;
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || '登录失败，请稍后重试');
      setLoading(false);
      return false;
    }
  };

  // 注册函数
  const register = async (data: RegisterRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(data);
      
      if (response.code === 200 && response.data) {
        const { user: userData, token } = response.data;
        
        const completeUserData: User = {
          userId: userData.userId,
          username: userData.username || '',
          name: userData.name || userData.nickname || userData.username || '',
          status: userData.status || 'online',
          avatar: userData.avatar || 'https://ai-public.mastergo.com/ai/img_res/3b71fa6479b687f7aac043084415c2d8.jpg',
          token: token,
          nickname: userData.nickname || userData.username,
          phone: userData.phone,
          email: userData.email,
          signature: userData.signature,
          onlineStatus: userData.onlineStatus || 'online',
          accountStatus: userData.accountStatus || 'active',
          systemRole: userData.systemRole || 'user',
          loginTime: new Date().toISOString(),
          globalMuteStatus: 'unmuted',
        };
        
        setUser(completeUserData);
        localStorage.setItem('user', JSON.stringify(completeUserData));
        
        // 建立 WebSocket 连接
        wsClient.connect(token);
        
        setLoading(false);
        return true;
      } else {
        setError(response.message || '注册失败');
        setLoading(false);
        return false;
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || '注册失败，请稍后重试');
      setLoading(false);
      return false;
    }
  };

  // 登出函数
  const logout = async () => {
    setLoading(true);
    
    try {
      // 断开 WebSocket
      wsClient.disconnect();
      // 调用登出 API
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // 无论成功失败都清除本地状态
      setUser(null);
      setCurrentRoomMember(null);
      setRoomMembers({});
      localStorage.removeItem('user');
      localStorage.removeItem('roomMembers');
      setLoading(false);
    }
  };

  // 清除错误
  const clearError = () => {
    setError(null);
  };

  // 刷新用户信息
  const refreshUserInfo = async () => {
    if (!user) return;
    
    try {
      const response = await userService.getCurrentUser();
      if (response.code === 200 && response.data) {
        const updatedUser: User = {
          ...user,
          ...response.data,
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Failed to refresh user info:', err);
    }
  };

  // 获取指定聊天室的成员信息
  const getCurrentRoomMember = useCallback((roomId: string): ChatRoomMember | null => {
    // 直接从 ref 中读取最新值
    return roomMembersRef.current[roomId] || null;
  }, []);

  // 设置当前聊天室成员信息（并缓存）
  const handleSetCurrentRoomMember = useCallback((member: ChatRoomMember | null) => {
    console.log('[AuthContext] setCurrentRoomMember 被调用:', member);
    setCurrentRoomMember(member);
    if (member) {
      setRoomMembers(prevRoomMembers => {
        const newRoomMembers = {
          ...prevRoomMembers,
          [member.roomId]: member,
        };
        console.log('[AuthContext] 更新 roomMembers 缓存:', newRoomMembers);
        localStorage.setItem('roomMembers', JSON.stringify(newRoomMembers));
        return newRoomMembers;
      });
    }
  }, []); // 空依赖数组，因为使用了函数式更新

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    refreshUserInfo,
    isAuthenticated: !!user,
    currentRoomMember,
    setCurrentRoomMember: handleSetCurrentRoomMember,
    getCurrentRoomMember,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
