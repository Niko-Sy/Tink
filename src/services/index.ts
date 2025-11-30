/**
 * 服务层统一导出
 */

// API 基础配置
export { api, apiRequest, tokenManager, config } from './api';
export type { ApiResponse, PaginatedResponse, ApiError } from './api';

// 认证服务
export { authService, login, register, logout, refreshToken, changePassword, isAuthenticated, getStoredUser } from './auth';
export type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ChangePasswordRequest } from './auth';

// 用户服务
export { userService, getCurrentUser, updateUserProfile, getUserById, searchUsersInRoom, updateOnlineStatus, uploadAvatar } from './user';
export type { UpdateUserProfileRequest, UserSearchResult, OnlineStatus } from './user';

// 聊天室服务
export { chatroomService, createRoom, joinRoom, leaveRoom, getMyChatRooms, getRoomInfo, updateRoom, deleteRoom } from './chatroom';
export type { CreateRoomRequest, CreateRoomResponse, JoinRoomRequest, JoinRoomResponse, LeaveRoomRequest, ChatRoomListItem, UpdateRoomRequest } from './chatroom';

// 消息服务
export { messageService, sendMessage, getMessageHistory, deleteMessage, editMessage, markMessagesRead, uploadChatImage } from './message';
export type { SendMessageRequest, SendMessageResponse, MessageListItem, MessageHistoryResponse, EditMessageRequest, EditMessageResponse } from './message';

// 成员管理服务
export { memberService, getMemberList, getMemberInfo, muteMember, unmuteMember, kickMember, setAdmin, removeAdmin } from './member';
export type { MemberListItem, MemberStatusFilter, MuteMemberRequest, MuteMemberResponse, UnmuteMemberRequest, KickMemberRequest, SetAdminRequest, SetAdminResponse } from './member';

// WebSocket 服务
export { wsClient, WebSocketClient } from './websocket';
export type { WSMessage, WSSendMessage, WSMessageType, WSNewMessage, WSUserStatus, WSRoomMember, WSMute, WSError } from './websocket';
