import type { User, ChatRoomMember, Message } from '../types';
import { Permission, RolePermissions } from '../types';

/**
 * 权限检查器接口
 */
export interface PermissionChecker {
  /**
   * 检查用户在特定聊天室是否有某个权限
   */
  hasPermission: (
    user: User | null,
    member: ChatRoomMember | null,
    permission: Permission
  ) => boolean;

  /**
   * 检查用户是否可以发送消息（考虑禁言状态）
   */
  canSendMessage: (
    user: User | null,
    member: ChatRoomMember | null
  ) => boolean;

  /**
   * 检查用户是否可以编辑消息
   */
  canEditMessage: (
    user: User | null,
    member: ChatRoomMember | null,
    message: Message
  ) => boolean;

  /**
   * 检查用户是否可以删除消息
   */
  canDeleteMessage: (
    user: User | null,
    member: ChatRoomMember | null,
    message: Message
  ) => boolean;

  /**
   * 检查用户是否可以禁言其他成员
   */
  canMuteMember: (
    user: User | null,
    member: ChatRoomMember | null
  ) => boolean;

  /**
   * 检查用户是否可以踢出成员
   */
  canRemoveMember: (
    user: User | null,
    member: ChatRoomMember | null
  ) => boolean;

  /**
   * 检查用户是否可以编辑聊天室信息
   */
  canEditRoomInfo: (
    user: User | null,
    member: ChatRoomMember | null
  ) => boolean;

  /**
   * 检查用户是否可以设置管理员
   */
  canSetAdmin: (
    user: User | null,
    member: ChatRoomMember | null
  ) => boolean;

  /**
   * 获取用户被禁言的原因（如果被禁言）
   */
  getMuteReason: (
    user: User | null,
    member: ChatRoomMember | null
  ) => string | null;
}

/**
 * 检查是否已过期
 */
function isExpired(endTime: string | undefined): boolean {
  if (!endTime) return true;
  return new Date() >= new Date(endTime);
}

/**
 * 权限检查工具实现
 */
export const permissionChecker: PermissionChecker = {
  /**
   * 检查用户在特定聊天室是否有某个权限
   */
  hasPermission: (user, member, permission) => {
    // 用户未登录，没有权限
    if (!user) {
      return false;
    }

    // 超级管理员拥有所有权限
    if (user.systemRole === 'super_admin') {
      return true;
    }

    // 如果用户不是该聊天室成员，没有权限
    if (!member || !member.isActive) {
      return false;
    }

    // 检查角色权限
    const rolePermissions = RolePermissions[member.roomRole];
    return rolePermissions.includes(permission);
  },

  /**
   * 检查用户是否可以发送消息（考虑禁言状态）
   */
  canSendMessage: (user, member) => {
    // 用户未登录，不能发送消息
    if (!user) {
      return false;
    }

    // 检查全局禁言
    if (user.globalMuteStatus === 'muted') {
      if (!isExpired(user.globalMuteEndTime)) {
        return false;
      }
    }

    // 检查聊天室禁言
    if (member?.isMuted) {
      if (!isExpired(member.muteUntil)) {
        return false;
      }
    }

    // 检查发送消息权限
    return permissionChecker.hasPermission(
      user,
      member,
      Permission.SEND_MESSAGE
    );
  },

  /**
   * 检查用户是否可以编辑消息
   */
  canEditMessage: (user, member, message) => {
    // 用户未登录，不能编辑消息
    if (!user) {
      return false;
    }

    // 超级管理员可以编辑任何消息
    if (user.systemRole === 'super_admin') {
      return true;
    }

    // 编辑自己的消息
    if (message.userId === user.userId) {
      return permissionChecker.hasPermission(
        user,
        member,
        Permission.EDIT_OWN_MESSAGE
      );
    }

    // 编辑他人的消息（需要管理员权限）
    return permissionChecker.hasPermission(
      user,
      member,
      Permission.EDIT_ANY_MESSAGE
    );
  },

  /**
   * 检查用户是否可以删除消息
   */
  canDeleteMessage: (user, member, message) => {
    // 用户未登录，不能删除消息
    if (!user) {
      return false;
    }

    // 超级管理员可以删除任何消息
    if (user.systemRole === 'super_admin') {
      return true;
    }

    // 删除自己的消息
    if (message.userId === user.userId) {
      return permissionChecker.hasPermission(
        user,
        member,
        Permission.DELETE_OWN_MESSAGE
      );
    }

    // 删除他人的消息（需要管理员权限）
    return permissionChecker.hasPermission(
      user,
      member,
      Permission.DELETE_ANY_MESSAGE
    );
  },

  /**
   * 检查用户是否可以禁言其他成员
   */
  canMuteMember: (user, member) => {
    return permissionChecker.hasPermission(
      user,
      member,
      Permission.MUTE_MEMBER
    );
  },

  /**
   * 检查用户是否可以踢出成员
   */
  canRemoveMember: (user, member) => {
    return permissionChecker.hasPermission(
      user,
      member,
      Permission.REMOVE_MEMBER
    );
  },

  /**
   * 检查用户是否可以编辑聊天室信息
   */
  canEditRoomInfo: (user, member) => {
    return permissionChecker.hasPermission(
      user,
      member,
      Permission.EDIT_ROOM_INFO
    );
  },

  /**
   * 检查用户是否可以设置管理员
   */
  canSetAdmin: (user, member) => {
    return permissionChecker.hasPermission(
      user,
      member,
      Permission.SET_ADMIN
    );
  },

  /**
   * 获取用户被禁言的原因（如果被禁言）
   */
  getMuteReason: (user, member) => {
    if (!user) {
      return null;
    }

    // 检查全局禁言
    if (user.globalMuteStatus === 'muted' && !isExpired(user.globalMuteEndTime)) {
      const endTime = user.globalMuteEndTime 
        ? new Date(user.globalMuteEndTime).toLocaleString('zh-CN')
        : '永久';
      return `你已被全局禁言，禁言至：${endTime}`;
    }

    // 检查聊天室禁言
    if (member?.isMuted && !isExpired(member.muteUntil)) {
      const endTime = member.muteUntil 
        ? new Date(member.muteUntil).toLocaleString('zh-CN')
        : '永久';
      return `你在此聊天室被禁言，禁言至：${endTime}`;
    }

    return null;
  },
};

/**
 * 工具函数：检查用户角色
 */
export const checkUserRole = {
  /**
   * 是否是超级管理员
   */
  isSuperAdmin: (user: User | null): boolean => {
    return user?.systemRole === 'super_admin';
  },

  /**
   * 是否是聊天室所有者
   */
  isRoomOwner: (member: ChatRoomMember | null): boolean => {
    return member?.roomRole === 'owner';
  },

  /**
   * 是否是聊天室管理员
   */
  isRoomAdmin: (member: ChatRoomMember | null): boolean => {
    return member?.roomRole === 'admin';
  },

  /**
   * 是否是聊天室管理员或所有者
   */
  isRoomAdminOrOwner: (member: ChatRoomMember | null): boolean => {
    return member?.roomRole === 'admin' || member?.roomRole === 'owner';
  },

  /**
   * 是否是普通成员
   */
  isRoomMember: (member: ChatRoomMember | null): boolean => {
    return member?.roomRole === 'member';
  },
};

/**
 * 获取权限错误提示
 */
export function getPermissionErrorMessage(permission: Permission): string {
  const messages: Record<Permission, string> = {
    [Permission.SEND_MESSAGE]: '你没有发送消息的权限',
    [Permission.EDIT_OWN_MESSAGE]: '你没有编辑自己消息的权限',
    [Permission.DELETE_OWN_MESSAGE]: '你没有删除自己消息的权限',
    [Permission.EDIT_ANY_MESSAGE]: '你没有编辑他人消息的权限（需要管理员权限）',
    [Permission.DELETE_ANY_MESSAGE]: '你没有删除他人消息的权限（需要管理员权限）',
    [Permission.PIN_MESSAGE]: '你没有置顶消息的权限（需要管理员权限）',
    [Permission.INVITE_MEMBER]: '你没有邀请成员的权限',
    [Permission.REMOVE_MEMBER]: '你没有踢出成员的权限（需要管理员权限）',
    [Permission.MUTE_MEMBER]: '你没有禁言成员的权限（需要管理员权限）',
    [Permission.UNMUTE_MEMBER]: '你没有解除禁言的权限（需要管理员权限）',
    [Permission.EDIT_ROOM_INFO]: '你没有编辑聊天室信息的权限（需要管理员权限）',
    [Permission.DELETE_ROOM]: '你没有删除聊天室的权限（仅所有者可操作）',
    [Permission.SET_ADMIN]: '你没有设置管理员的权限（仅所有者可操作）',
    [Permission.REMOVE_ADMIN]: '你没有移除管理员的权限（仅所有者可操作）',
    [Permission.UPLOAD_FILE]: '你没有上传文件的权限',
    [Permission.DELETE_OWN_FILE]: '你没有删除自己文件的权限',
    [Permission.DELETE_ANY_FILE]: '你没有删除他人文件的权限（需要管理员权限）',
  };

  return messages[permission] || '你没有执行此操作的权限';
}
