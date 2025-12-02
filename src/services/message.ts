/**
 * 消息相关 API
 * - 发送消息（HTTP 方式，WebSocket 发送见 websocket.ts）
 * - 获取聊天室消息历史
 * - 撤回/删除消息
 * - 编辑消息
 * - 标记消息已读
 */

import { apiRequest } from './api';
import type { ApiResponse } from './api';
import type { Message } from '../types';

// ==================== 请求/响应类型定义 ====================

// 发送消息请求
export interface SendMessageRequest {
  type: 'text' | 'image' | 'file';
  text: string;
  quotedMessageId?: string;  // 引用的消息ID（用于回复功能）
}

// 发送消息响应
export interface SendMessageResponse {
  messageId: string;
  type: 'text' | 'image' | 'file';
  text: string;
  sendTime: string;
  status: 'sent' | 'delivered' | 'read';
}

// 消息列表项（包含发送者信息）
export interface MessageListItem {
  messageId: string;
  roomId: string;
  userId: string;
  username?: string;  // API 文档中的字段
  nickname?: string;  // 备用字段
  userName?: string;  // 实际后端返回的字段
  avatar?: string;
  type: 'text' | 'image' | 'file' | 'system' | 'system_notification';
  text: string;
  createdTime?: string;  // API 文档中的字段
  time?: string;  // 实际后端返回的字段
  updatedTime?: string;
  isEdited: boolean;
  editedAt?: string | null;  // 实际后端返回的字段
  isOwn?: boolean;  // 实际后端返回的字段
  replyToMessageId?: string;  // 后端返回的引用消息ID（新格式）
  replyTo?: {  // 旧格式，兼容保留
    messageId: string;
    userId: string;
    nickname: string;
    text: string;
  };
  status: 'sent' | 'delivered' | 'read' | 'deleted';
}

// 消息历史分页响应（支持游标分页）
export interface MessageHistoryResponse {
  list?: MessageListItem[];  // 旧版本字段名
  messages?: MessageListItem[];  // 新版本字段名（实际后端使用）
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  oldestMessageId?: string;
  newestMessageId?: string;
}

// 编辑消息请求
export interface EditMessageRequest {
  text: string;
}

// 编辑消息响应
export interface EditMessageResponse {
  messageId: string;
  text: string;
  isEdited: boolean;
  editedTime: string;
}

// 标记已读请求
export interface MarkReadRequest {
  lastReadMessageId: string;
}

// ==================== API 函数 ====================

/**
 * 发送消息（HTTP 方式）
 * POST /chatroom/:roomid/messages
 * 注意：实时消息建议使用 WebSocket 发送
 */
export const sendMessage = async (
  roomId: string,
  data: SendMessageRequest
): Promise<ApiResponse<SendMessageResponse>> => {
  return apiRequest.post<SendMessageResponse>(`/chatroom/${roomId}/messages`, data);
};

/**
 * 获取聊天室消息历史
 * GET /chatroom/:roomid/messages
 * 
 * 分页方式：
 * - 传统分页：page=1 返回最新消息
 * - 游标分页：before=<messageId> 获取指定消息之前（更早）的消息
 */
export const getMessageHistory = async (
  roomId: string,
  options: {
    page?: number;
    pageSize?: number;
    before?: string;  // 游标分页：获取此消息ID之前的消息
  } = {}
): Promise<ApiResponse<MessageHistoryResponse>> => {
  const { page = 1, pageSize = 50, before } = options;
  
  const params: Record<string, unknown> = { pageSize };
  
  if (before) {
    params.before = before;
  } else {
    params.page = page;
  }
  
  return apiRequest.get<MessageHistoryResponse>(
    `/chatroom/${roomId}/messages`,
    params
  );
};

/**
 * 撤回/删除消息
 * POST /chatroom/:roomid/messages/:messageid/delete
 * 权限: 消息发送者或管理员
 */
export const deleteMessage = async (
  roomId: string,
  messageId: string
): Promise<ApiResponse<null>> => {
  return apiRequest.post<null>(`/chatroom/${roomId}/messages/${messageId}/delete`);
};

/**
 * 编辑消息
 * POST /chatroom/:roomid/messages/:messageid/edit
 * 权限: 消息发送者或管理员
 */
export const editMessage = async (
  roomId: string,
  messageId: string,
  data: EditMessageRequest
): Promise<ApiResponse<EditMessageResponse>> => {
  return apiRequest.post<EditMessageResponse>(
    `/chatroom/${roomId}/messages/${messageId}/edit`,
    data
  );
};

/**
 * 标记消息已读
 * POST /chatroom/:roomid/messages/read
 */
export const markMessagesRead = async (
  roomId: string,
  data: MarkReadRequest
): Promise<ApiResponse<null>> => {
  return apiRequest.post<null>(`/chatroom/${roomId}/messages/read`, data);
};

/**
 * 上传聊天图片
 * POST /chatroom/:roomid/uploadimage
 * 限制: 最大 5MB，支持 jpg/png/gif/webp
 */
export const uploadChatImage = async (
  roomId: string,
  file: File
): Promise<ApiResponse<{ imageUrl: string; thumbnailUrl: string }>> => {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest.upload<{ imageUrl: string; thumbnailUrl: string }>(
    `/chatroom/${roomId}/uploadimage`,
    formData
  );
};

// ==================== 辅助函数 ====================

/**
 * 将 MessageListItem 转换为 Message（兼容现有组件）
 */
export const toMessage = (item: MessageListItem, currentUserId: string): Message => ({
  messageId: item.messageId,
  roomId: item.roomId,
  userId: item.userId,
  userName: item.userName || item.nickname || item.username || '未知用户',
  quotedMessageId: item.replyToMessageId || item.replyTo?.messageId,  // 优先使用 replyToMessageId，兼容旧格式
  type: item.type as Message['type'],
  text: item.text,
  time: item.time || item.createdTime || new Date().toISOString(),
  isOwn: item.isOwn !== undefined ? item.isOwn : (item.userId === currentUserId),
});

/**
 * 格式化消息时间
 */
export const formatMessageTime = (isoTime: string): string => {
  const date = new Date(isoTime);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 判断是否是昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // 其他日期
  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 验证图片文件
 */
export const validateChatImage = (file: File): { valid: boolean; message?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (file.size > maxSize) {
    return { valid: false, message: '图片大小不能超过 5MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: '只支持 jpg/png/gif/webp 格式' };
  }

  return { valid: true };
};

// 导出默认对象
export const messageService = {
  sendMessage,
  getMessageHistory,
  deleteMessage,
  editMessage,
  markMessagesRead,
  uploadChatImage,
  toMessage,
  formatMessageTime,
  validateChatImage,
};

export default messageService;
