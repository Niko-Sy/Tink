/**
 * 用户相关 API
 * - 获取当前用户信息
 * - 更新用户资料
 * - 根据ID获取用户信息
 * - 在聊天室内搜索用户
 * - 更新在线状态
 * - 上传头像
 */

import { apiRequest } from './api';
import type { ApiResponse, PaginatedResponse } from './api';
import type { User } from '../types';

// ==================== 请求/响应类型定义 ====================

// 更新用户资料请求
export interface UpdateUserProfileRequest {
  nickname?: string;
  avatar?: string;
  signature?: string;
  phone?: string;
  email?: string;
}

// 用户搜索结果
export interface UserSearchResult {
  userId: string;
  username: string;
  nickname: string;
  avatar: string;
  onlineStatus: 'online' | 'away' | 'busy' | 'offline';
}

// 在线状态类型
export type OnlineStatus = 'online' | 'away' | 'busy' | 'offline';

// ==================== API 函数 ====================

/**
 * 获取当前用户信息
 * GET /users/me/userinfo
 */
export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  return apiRequest.get<User>('/users/me/userinfo');
};

/**
 * 更新用户资料
 * POST /users/me/update
 */
export const updateUserProfile = async (
  data: UpdateUserProfileRequest
): Promise<ApiResponse<User>> => {
  return apiRequest.post<User>('/users/me/update', data);
};

/**
 * 根据ID获取用户信息（不含敏感信息）
 * GET /users/:userid/info
 */
export const getUserById = async (userId: string): Promise<ApiResponse<User>> => {
  return apiRequest.get<User>(`/users/${userId}/info`);
};

/**
 * 在聊天室内搜索用户
 * GET /chatroom/:roomid/members/search
 * 需要鉴权，若用户不属于聊天室内成员则无法搜索
 */
export const searchUsersInRoom = async (
  roomId: string,
  keyword: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<PaginatedResponse<UserSearchResult>>> => {
  return apiRequest.get<PaginatedResponse<UserSearchResult>>(
    `/chatroom/${roomId}/members/search`,
    { keyword, page, pageSize }
  );
};

/**
 * 更新在线状态
 * POST /users/me/updatestatus
 */
export const updateOnlineStatus = async (
  onlineStatus: OnlineStatus
): Promise<ApiResponse<null>> => {
  return apiRequest.post<null>('/users/me/updatestatus', { onlineStatus });
};

/**
 * 上传头像
 * POST /users/me/uploadavatar
 * 限制: 最大 5MB，支持 jpg/png/gif/webp
 * 返回: { fileName: string, fileSize: number, url: string }
 */
export const uploadAvatar = async (file: File): Promise<ApiResponse<{ 
  fileName: string; 
  fileSize: number; 
  url: string; 
}>> => {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest.upload<{ fileName: string; fileSize: number; url: string; }>('/users/me/uploadavatar', formData);
};

// ==================== 辅助函数 ====================

/**
 * 验证头像文件
 */
export const validateAvatarFile = (file: File): { valid: boolean; message?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (file.size > maxSize) {
    return { valid: false, message: '文件大小不能超过 5MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: '只支持 jpg/png/gif/webp 格式' };
  }

  return { valid: true };
};

// 导出默认对象
export const userService = {
  getCurrentUser,
  updateUserProfile,
  getUserById,
  searchUsersInRoom,
  updateOnlineStatus,
  uploadAvatar,
  validateAvatarFile,
};

export default userService;
