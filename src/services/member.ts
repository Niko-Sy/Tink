/**
 * 聊天室成员管理 API
 * - 获取聊天室成员列表
 * - 获取用户在聊天室的成员信息
 * - 禁言用户
 * - 解除禁言
 * - 踢出成员
 * - 设置管理员
 * - 取消管理员
 */

import { apiRequest } from './api';
import type { ApiResponse, PaginatedResponse } from './api';
import type { ChatRoomMember } from '../types';

// ==================== 请求/响应类型定义 ====================

// 成员列表项
export interface MemberListItem {
  memberId: string;
  roomId: string;
  userId: string;
  username: string;
  nickname: string;
  avatar: string;
  onlineStatus: 'online' | 'away' | 'busy' | 'offline';
  roomRole: 'owner' | 'admin' | 'member';
  isMuted: boolean;
  muteUntil?: string;
  joinedAt: string;
}

// 成员状态过滤
export type MemberStatusFilter = 'online' | 'away' | 'offline' | 'all';

// 禁言请求
export interface MuteMemberRequest {
  memberid: string;
  duration: number;  // 分钟，0表示永久
  reason?: string;
}

// 禁言响应
export interface MuteMemberResponse {
  muteUntil: string;
  reason?: string;
}

// 解除禁言请求
export interface UnmuteMemberRequest {
  memberid: string;
}

// 踢出成员请求
export interface KickMemberRequest {
  memberid: string;
  reason?: string;
}

// 设置/取消管理员请求
export interface SetAdminRequest {
  memberid: string;
}

// 设置管理员响应
export interface SetAdminResponse {
  memberId: string;
  newRole: 'admin' | 'member';
}

// ==================== API 函数 ====================

/**
 * 获取聊天室成员列表
 * GET /chatroom/:roomid/members/memberlist
 * 需要鉴权，若用户不属于聊天室内成员则无法获得成员列表信息
 */
export const getMemberList = async (
  roomId: string,
  options: {
    page?: number;
    pageSize?: number;
    status?: MemberStatusFilter;
  } = {}
): Promise<ApiResponse<PaginatedResponse<MemberListItem>>> => {
  const { page = 1, pageSize = 20, status = 'all' } = options;
  
  return apiRequest.get<PaginatedResponse<MemberListItem>>(
    `/chatroom/${roomId}/members/memberlist`,
    { page, pageSize, status }
  );
};

/**
 * 获取用户在聊天室的成员信息
 * GET /chatroom/:roomid/members/:userid/info
 * 需要鉴权，如果请求者不在聊天室内，则接口不返回信息
 */
export const getMemberInfo = async (
  roomId: string,
  userId: string
): Promise<ApiResponse<MemberListItem>> => {
  return apiRequest.get<MemberListItem>(`/chatroom/${roomId}/members/${userId}/info`);
};

/**
 * 禁言用户
 * POST /chatroom/:roomid/members/mute
 * 权限: 管理员权限
 */
export const muteMember = async (
  roomId: string,
  data: MuteMemberRequest
): Promise<ApiResponse<MuteMemberResponse>> => {
  return apiRequest.post<MuteMemberResponse>(`/chatroom/${roomId}/members/mute`, data);
};

/**
 * 解除禁言
 * POST /chatroom/:roomid/members/unmute
 * 权限: 管理员权限
 */
export const unmuteMember = async (
  roomId: string,
  data: UnmuteMemberRequest
): Promise<ApiResponse<null>> => {
  return apiRequest.post<null>(`/chatroom/${roomId}/members/unmute`, data);
};

/**
 * 踢出成员
 * POST /chatroom/:roomid/members/kick
 * 权限: 管理员权限
 */
export const kickMember = async (
  roomId: string,
  data: KickMemberRequest
): Promise<ApiResponse<null>> => {
  return apiRequest.post<null>(`/chatroom/${roomId}/members/kick`, data);
};

/**
 * 设置管理员
 * POST /chatroom/:roomid/members/setadmin
 * 权限: 仅房主
 */
export const setAdmin = async (
  roomId: string,
  data: SetAdminRequest
): Promise<ApiResponse<SetAdminResponse>> => {
  return apiRequest.post<SetAdminResponse>(`/chatroom/${roomId}/members/setadmin`, data);
};

/**
 * 取消管理员
 * POST /chatroom/:roomid/members/removeadmin
 * 权限: 仅房主
 */
export const removeAdmin = async (
  roomId: string,
  data: SetAdminRequest
): Promise<ApiResponse<null>> => {
  return apiRequest.post<null>(`/chatroom/${roomId}/members/removeadmin`, data);
};

// ==================== 辅助函数 ====================

/**
 * 将 MemberListItem 转换为 ChatRoomMember（兼容现有组件）
 */
export const toChatRoomMember = (item: MemberListItem): ChatRoomMember => ({
  memberId: item.memberId,
  roomId: item.roomId,
  userId: item.userId,
  roomRole: item.roomRole,
  isMuted: item.isMuted,
  muteUntil: item.muteUntil,
  joinedAt: item.joinedAt,
  isActive: true,
});

/**
 * 格式化禁言时长
 */
export const formatMuteDuration = (minutes: number): string => {
  if (minutes === 0) return '永久';
  if (minutes < 60) return `${minutes}分钟`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时`;
  return `${Math.floor(minutes / 1440)}天`;
};

/**
 * 禁言时长选项
 */
export const muteDurationOptions = [
  { label: '5分钟', value: 5 },
  { label: '10分钟', value: 10 },
  { label: '30分钟', value: 30 },
  { label: '1小时', value: 60 },
  { label: '12小时', value: 720 },
  { label: '1天', value: 1440 },
  { label: '7天', value: 10080 },
  { label: '永久', value: 0 },
];

/**
 * 检查禁言是否已过期
 */
export const isMuteExpired = (muteUntil?: string): boolean => {
  if (!muteUntil) return true;
  return new Date(muteUntil) <= new Date();
};

// 导出默认对象
export const memberService = {
  getMemberList,
  getMemberInfo,
  muteMember,
  unmuteMember,
  kickMember,
  setAdmin,
  removeAdmin,
  toChatRoomMember,
  formatMuteDuration,
  muteDurationOptions,
  isMuteExpired,
};

export default memberService;
