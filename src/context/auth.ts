import { createContext } from 'react';
import type { ChatRoomMember, User as UserType } from '../types';
import type { LoginRequest, RegisterRequest } from '../services';
// 使用types中的User接口，扩展登录相关字段
export interface AuthUser extends UserType {
  token?: string;
  loginTime?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
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


export const AuthContext = createContext<AuthContextType | undefined>(undefined);
