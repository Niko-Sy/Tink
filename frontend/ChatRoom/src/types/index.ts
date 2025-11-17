// 统一的用户接口定义 - 与AuthContext保持一致
export interface User {
  userId: string;
  name: string;
  status: string;
  avatar: string;
  username?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  signature?: string;
  onlineStatus?: 'online' | 'away' | 'busy' | 'offline';
  accountStatus?: 'active' | 'inactive' | 'suspended';
  
  // 全局系统角色（影响整个系统的权限）
  systemRole?: 'super_admin' | 'user';
  
  registerTime?: string;
  lastloginTime?: string;
  
  // 全局禁言状态（超级管理员设置）
  globalMuteStatus?: 'muted' | 'unmuted';
  globalMuteEndTime?: string;
}

// 消息接口
export interface Message {
  messageId: string;
  roomId: string;
  userId: string; // 改为string类型,与User的userId一致
  userName?: string; // 添加用户名字段,用于前端显示
  importmessageId: string;
  type: 'text' | 'image' | 'file' | 'system';
  text: string;
  time: string;
  isOwn: boolean;
}

// 聊天室接口
export interface ChatRoom {
  roomId: string;
  name: string;
  description: string;
  icon: string;
  type: 'public' | 'private' | 'protected';
  password?: string;
  creatorId?: string; // 创建者ID
  onlineCount: number;
  peopleCount: number;
  createdTime: string;
  lastMessageTime: string;
  unread: number;
  
  // 可选：当前用户在该聊天室的成员信息
  currentUserMember?: ChatRoomMember;
}

// 聊天室成员接口（包含该用户在特定聊天室的角色和状态）
export interface ChatRoomMember {
  memberId: string;
  roomId: string;
  userId: string;
  
  // 聊天室内角色（只影响该聊天室的权限）
  roomRole: 'owner' | 'admin' | 'member';
  
  // 聊天室内禁言状态
  isMuted: boolean;
  muteUntil?: string; // 禁言到期时间
  
  joinedAt: string;
  lastReadAt?: string;
  isActive: boolean; // 是否还在聊天室
  leftAt?: string;
}

// 禁言记录接口
export interface MuteRecord {
  recordId: string;
  userId: string;
  roomId: string;
  mutedBy: string;
  muteStartTime: string;
  muteEndTime: string;
  active?: boolean;
  reason?: string;
}

// 权限常量（使用 const 对象代替 enum 以兼容 isolatedModules）
export const Permission = {
  // 消息相关
  SEND_MESSAGE: 'send_message',
  EDIT_OWN_MESSAGE: 'edit_own_message',
  DELETE_OWN_MESSAGE: 'delete_own_message',
  EDIT_ANY_MESSAGE: 'edit_any_message',
  DELETE_ANY_MESSAGE: 'delete_any_message',
  PIN_MESSAGE: 'pin_message',
  
  // 成员管理
  INVITE_MEMBER: 'invite_member',
  REMOVE_MEMBER: 'remove_member',
  MUTE_MEMBER: 'mute_member',
  UNMUTE_MEMBER: 'unmute_member',
  
  // 聊天室管理
  EDIT_ROOM_INFO: 'edit_room_info',
  DELETE_ROOM: 'delete_room',
  SET_ADMIN: 'set_admin',
  REMOVE_ADMIN: 'remove_admin',
  
  // 文件管理
  UPLOAD_FILE: 'upload_file',
  DELETE_OWN_FILE: 'delete_own_file',
  DELETE_ANY_FILE: 'delete_any_file',
} as const;

export type Permission = typeof Permission[keyof typeof Permission];

// 角色权限映射
export const RolePermissions: Record<
  'owner' | 'admin' | 'member',
  Permission[]
> = {
  owner: [
    // 拥有所有权限
    Permission.SEND_MESSAGE,
    Permission.EDIT_OWN_MESSAGE,
    Permission.DELETE_OWN_MESSAGE,
    Permission.EDIT_ANY_MESSAGE,
    Permission.DELETE_ANY_MESSAGE,
    Permission.PIN_MESSAGE,
    Permission.INVITE_MEMBER,
    Permission.REMOVE_MEMBER,
    Permission.MUTE_MEMBER,
    Permission.UNMUTE_MEMBER,
    Permission.EDIT_ROOM_INFO,
    Permission.DELETE_ROOM,
    Permission.SET_ADMIN,
    Permission.REMOVE_ADMIN,
    Permission.UPLOAD_FILE,
    Permission.DELETE_OWN_FILE,
    Permission.DELETE_ANY_FILE,
  ],
  admin: [
    // 管理员权限（无法删除聊天室、设置管理员）
    Permission.SEND_MESSAGE,
    Permission.EDIT_OWN_MESSAGE,
    Permission.DELETE_OWN_MESSAGE,
    Permission.EDIT_ANY_MESSAGE,
    Permission.DELETE_ANY_MESSAGE,
    Permission.PIN_MESSAGE,
    Permission.INVITE_MEMBER,
    Permission.REMOVE_MEMBER,
    Permission.MUTE_MEMBER,
    Permission.UNMUTE_MEMBER,
    Permission.UPLOAD_FILE,
    Permission.DELETE_OWN_FILE,
    Permission.DELETE_ANY_FILE,
  ],
  member: [
    // 普通成员权限
    Permission.SEND_MESSAGE,
    Permission.EDIT_OWN_MESSAGE,
    Permission.DELETE_OWN_MESSAGE,
    Permission.INVITE_MEMBER,
    Permission.UPLOAD_FILE,
    Permission.DELETE_OWN_FILE,
  ],
};
