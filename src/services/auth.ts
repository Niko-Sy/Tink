/**
 * 认证相关 API
 * - 用户登录
 * - 用户注册
 * - 退出登录
 * - 刷新 Token
 * - 修改密码
 */

import { apiRequest, tokenManager } from './api';
import type { ApiResponse } from './api';
import type { User } from '../types';

// ==================== 请求/响应类型定义 ====================

// 登录请求
export interface LoginRequest {
  username: string;  // 用户名或邮箱
  password: string;
}

// 登录响应
export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

// 注册请求
export interface RegisterRequest {
  username: string;  // 3-20字符，仅字母数字下划线
  password: string;  // 6-20字符
  email: string;
  nickname?: string;  // 可选昵称
}

// 注册响应 - 与登录响应相同
export type RegisterResponse = LoginResponse;

// 修改密码请求
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// 刷新 Token 响应
export interface RefreshTokenResponse {
  token: string;
  expiresAt: string;
}

// ==================== API 函数 ====================

/**
 * 用户登录
 * POST /auth/login
 */
export const login = async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  const response = await apiRequest.post<LoginResponse>('/auth/login', data);
  
  // 保存 Token
  if (response.code === 200 && response.data) {
    tokenManager.setToken(response.data.token);
    tokenManager.setRefreshToken(response.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response;
};

/**
 * 用户注册
 * POST /auth/register
 */
export const register = async (data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
  const response = await apiRequest.post<RegisterResponse>('/auth/register', data);
  
  // 注册成功后自动保存 Token
  if (response.code === 200 && response.data) {
    tokenManager.setToken(response.data.token);
    tokenManager.setRefreshToken(response.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response;
};

/**
 * 退出登录
 * GET /auth/logout
 */
export const logout = async (): Promise<ApiResponse<null>> => {
  try {
    const response = await apiRequest.get<null>('/auth/logout');
    return response;
  } finally {
    // 无论成功失败都清除本地 Token
    tokenManager.clearAll();
  }
};

/**
 * 刷新 Token
 * GET /auth/refresh
 */
export const refreshToken = async (): Promise<ApiResponse<RefreshTokenResponse>> => {
  const response = await apiRequest.get<RefreshTokenResponse>('/auth/refresh');
  
  if (response.code === 200 && response.data) {
    tokenManager.setToken(response.data.token);
  }
  
  return response;
};

/**
 * 修改密码
 * POST /auth/changepwd
 */
export const changePassword = async (data: ChangePasswordRequest): Promise<ApiResponse<null>> => {
  return apiRequest.post<null>('/auth/changepwd', data);
};

// ==================== 辅助函数 ====================

/**
 * 检查是否已登录
 */
export const isAuthenticated = (): boolean => {
  const token = tokenManager.getToken();
  return !!token && !tokenManager.isTokenExpired();
};

/**
 * 获取存储的用户信息
 */
export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }
  return null;
};

// 导出默认对象
export const authService = {
  login,
  register,
  logout,
  refreshToken,
  changePassword,
  isAuthenticated,
  getStoredUser,
};

export default authService;
