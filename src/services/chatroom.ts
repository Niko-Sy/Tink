/**
 * 聊天室相关 API
 * - 创建聊天室
 * - 加入聊天室
 * - 退出聊天室
 * - 获取用户的聊天室列表
 * - 获取聊天室详情
 * - 更新聊天室信息
 * - 删除聊天室
 */

import { apiRequest } from './api';
import type { ApiResponse, PaginatedResponse } from './api';
import type { ChatRoom } from '../types';

// ==================== 请求/响应类型定义 ====================

// 创建聊天室请求
export interface CreateRoomRequest {
  name: string;
  description?: string;
  type: 'public' | 'private' | 'protected';  // public/私密邀请/密码保护
  password?: string;  // protected 类型需要
  icon?: string;
}

// 创建聊天室响应 - 聊天室数据
export interface CreateRoomChatroom {
  roomId: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'protected';
  icon: string;
  creatorId: string;
  onlineCount: number;
  peopleCount: number;
  createdTime: string;
  lastMessageTime: string;
}

// 创建聊天室响应 - 成员信息
export interface CreateRoomMemberInfo {
  memberId: string;
  roomId: string;
  userId: string;
  roomRole: 'owner' | 'admin' | 'member';
  isMuted: boolean;
  muteExpireAt?: string;
  joinedAt: string;
  isActive: boolean;
}

// 创建聊天室响应
export interface CreateRoomResponse {
  chatroom: CreateRoomChatroom;
  memberInfo: CreateRoomMemberInfo;
}

// 加入聊天室请求
export interface JoinRoomRequest {
  roomId: string;
  password?: string;  // protected 类型需要
}

// 加入聊天室响应 - 聊天室数据
export interface JoinRoomChatroom {
  roomId: string;
  name: string;
  description: string;
  icon: string;
  type: 'public' | 'private' | 'protected';
  onlineCount: number;
  peopleCount: number;
  createdTime: string;
  lastMessageTime: string;
}

// 加入聊天室响应 - 成员信息
export interface JoinRoomMemberInfo {
  memberId: string;
  roomId: string;
  userId: string;
  roomRole: 'owner' | 'admin' | 'member';
  isMuted: boolean;
  muteExpireAt?: string;
  joinedAt: string;
  isActive: boolean;
}

// 加入聊天室响应
export interface JoinRoomResponse {
  chatroom: JoinRoomChatroom;
  memberInfo: JoinRoomMemberInfo;
}

// 退出聊天室请求
export interface LeaveRoomRequest {
  roomId: string;
}

// 聊天室列表项（带用户相关信息）
export interface ChatRoomListItem {
  roomId: string;
  name: string;
  description: string;
  icon: string;
  type: 'public' | 'private' | 'protected';
  onlineCount: number;
  peopleCount: number;
  createdTime: string;
  lastMessageTime: string;
  unreadCount: number;
  myRole: 'owner' | 'admin' | 'member';
  lastMessage?: {
    text: string;
    senderName: string;
    time: string;
  };
}

// 更新聊天室请求
export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  type?: 'public' | 'private' | 'protected';
  password?: string;
  icon?: string;
}

// ==================== API 函数 ====================

/**
 * 创建聊天室
 * POST /chatroom/createroom
 */
export const createRoom = async (
  data: CreateRoomRequest
): Promise<ApiResponse<CreateRoomResponse>> => {
  return apiRequest.post<CreateRoomResponse>('/chatroom/createroom', data);
};

/**
 * 加入聊天室
 * POST /chatroom/joinroom
 */
export const joinRoom = async (
  data: JoinRoomRequest
): Promise<ApiResponse<JoinRoomResponse>> => {
  return apiRequest.post<JoinRoomResponse>('/chatroom/joinroom', data);
};

/**
 * 退出聊天室
 * POST /chatroom/leaveroom
 * 注意：房主不能直接退出，需先转让权限或解散聊天室
 */
export const leaveRoom = async (
  data: LeaveRoomRequest
): Promise<ApiResponse<null>> => {
  return apiRequest.post<null>('/chatroom/leaveroom', data);
};

/**
 * 获取用户的聊天室列表
 * GET /users/me/chatrooms
 */
export const getMyChatRooms = async (
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<PaginatedResponse<ChatRoomListItem>>> => {
  return apiRequest.get<PaginatedResponse<ChatRoomListItem>>(
    '/users/me/chatrooms',
    { page, pageSize }
  );
};

/**
 * 获取聊天室详情
 * GET /chatroom/:roomid/info
 */
export const getRoomInfo = async (
  roomId: string
): Promise<ApiResponse<ChatRoom>> => {
  return apiRequest.get<ChatRoom>(`/chatroom/${roomId}/info`);
};

/**
 * 更新聊天室信息
 * POST /chatroom/:roomid/update
 * 权限: 需要管理员权限
 */
export const updateRoom = async (
  roomId: string,
  data: UpdateRoomRequest
): Promise<ApiResponse<ChatRoom>> => {
  return apiRequest.post<ChatRoom>(`/chatroom/${roomId}/update`, data);
};

/**
 * 删除聊天室
 * POST /chatroom/:roomid/delete
 * 权限: 仅创建者可删除
 */
export const deleteRoom = async (
  roomId: string
): Promise<ApiResponse<null>> => {
  return apiRequest.post<null>(`/chatroom/${roomId}/delete`);
};

// ==================== 辅助函数 ====================

/**
 * 将 ChatRoomListItem 转换为 ChatRoom（兼容现有组件）
 */
export const toChatRoom = (item: ChatRoomListItem): ChatRoom => ({
  roomId: item.roomId,
  name: item.name,
  description: item.description,
  icon: item.icon,
  type: item.type,
  onlineCount: item.onlineCount,
  peopleCount: item.peopleCount,
  createdTime: item.createdTime,
  lastMessageTime: item.lastMessageTime,
  unread: item.unreadCount,
});

/**
 * 验证聊天室ID格式（9位数字）
 */
export const validateRoomId = (roomId: string): boolean => {
  return /^\d{9}$/.test(roomId);
};

// 导出默认对象
export const chatroomService = {
  createRoom,
  joinRoom,
  leaveRoom,
  getMyChatRooms,
  getRoomInfo,
  updateRoom,
  deleteRoom,
  toChatRoom,
  validateRoomId,
};

export default chatroomService;
