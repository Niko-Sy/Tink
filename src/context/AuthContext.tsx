import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ChatRoomMember, User as UserType } from '../types';

// 使用types中的User接口，扩展登录相关字段
interface User extends UserType {
  token: string;
  loginTime?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: Partial<User> & { username: string; token: string; userId: string }) => void;
  logout: () => void;
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
  const [currentRoomMember, setCurrentRoomMember] = useState<ChatRoomMember | null>(null);
  const [roomMembers, setRoomMembers] = useState<Record<string, ChatRoomMember>>({});
  
  // 使用 ref 来存储最新的 roomMembers，避免闭包问题
  const roomMembersRef = useRef<Record<string, ChatRoomMember>>({});

  // 同步 ref 和 state
  useEffect(() => {
    roomMembersRef.current = roomMembers;
  }, [roomMembers]);

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

    // 加载聊天室成员信息
    const storedMembers = localStorage.getItem('roomMembers');
    if (storedMembers) {
      try {
        const membersData = JSON.parse(storedMembers);
        setRoomMembers(membersData);
      } catch (error) {
        console.error('Failed to parse room members data:', error);
        localStorage.removeItem('roomMembers');
      }
    }
  }, []);

  // 登录函数
  const login = (userData: Partial<User> & { username: string; token: string; userId: string }) => {
    const completeUserData: User = {
      userId: userData.userId,
      username: userData.username || '',
      name: userData.name || userData.nickname || userData.username,
      status: userData.status || 'online',
      avatar: userData.avatar || 'https://ai-public.mastergo.com/ai/img_res/3b71fa6479b687f7aac043084415c2d8.jpg',
      token: userData.token,
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
  };

  // 登出函数
  const logout = () => {
    setUser(null);
    setCurrentRoomMember(null);
    setRoomMembers({});
    localStorage.removeItem('user');
    localStorage.removeItem('roomMembers');
  };

  // 获取指定聊天室的成员信息
  const getCurrentRoomMember = useCallback((roomId: string): ChatRoomMember | null => {
    // 直接从 ref 中读取最新值
    return roomMembersRef.current[roomId] || null;
  }, []);

  // 设置当前聊天室成员信息（并缓存）
  const handleSetCurrentRoomMember = useCallback((member: ChatRoomMember | null) => {
    setCurrentRoomMember(member);
    if (member) {
      setRoomMembers(prevRoomMembers => {
        const newRoomMembers = {
          ...prevRoomMembers,
          [member.roomId]: member,
        };
        localStorage.setItem('roomMembers', JSON.stringify(newRoomMembers));
        return newRoomMembers;
      });
    }
  }, []); // 空依赖数组，因为使用了函数式更新

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    currentRoomMember,
    setCurrentRoomMember: handleSetCurrentRoomMember,
    getCurrentRoomMember,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
