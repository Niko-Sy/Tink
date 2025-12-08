/**
 * 聊天室成员管理 Hook
 * 负责获取和管理聊天室成员列表
 */

import { useState, useCallback } from 'react';
import type { User, ChatRoomMember } from '../types';
import { memberService } from '../services';
import { DEFAULT_AVATAR_URL } from '../config/constants';

export interface UseRoomMembersReturn {
  users: User[];
  fetchRoomMembers: (roomId: string) => Promise<void>;
  fetchCurrentMemberInfo: (roomId: string) => Promise<void>;
  updateUserStatus: (userId: string, status: 'online' | 'away' | 'busy' | 'offline') => void;
  updateUserMuteStatus: (userId: string, isMuted: boolean, muteUntil?: string | null) => void;
  updateUserRole: (userId: string, roomRole: 'owner' | 'admin' | 'member') => void;
  removeUser: (userId: string) => void;
}

interface UseRoomMembersOptions {
  user: User | null;
  setCurrentRoomMember: (member: ChatRoomMember | null) => void;
}

export const useRoomMembers = ({
  user,
  setCurrentRoomMember,
}: UseRoomMembersOptions): UseRoomMembersReturn => {
  const [users, setUsers] = useState<User[]>([]);

  // 获取聊天室成员列表
  const fetchRoomMembers = useCallback(async (roomId: string) => {
    if (roomId === '100000001') {
      setUsers([]);
      return;
    }
    
    try {
      const response = await memberService.getMemberList(roomId, { pageSize: 100 });
      if (response.code === 200 && response.data) {
        const rawData = response.data as unknown as { 
          members?: Array<{
            userId: string;
            username: string;
            nickname?: string;
            name?: string;
            avatar: string;
            status: string;
            memberInfo?: {
              memberId: string;
              roomRole: 'owner' | 'admin' | 'member';
              isMuted: boolean;
              muteUntil: string | null;
              joinedAt: string;
              isActive: boolean;
            };
          }>;
          list?: Array<{ userId: string; nickname?: string; username: string; onlineStatus: string; avatar: string }>;
        };
        
        const memberList = rawData.members || rawData.list || [];
        
        // 保留完整的成员信息，包括 roomRole 和 isMuted 状态
        const members: User[] = memberList.map((member: any) => ({
          userId: member.userId,
          name: member.nickname || member.name || member.username,
          status: (member.status || member.onlineStatus || 'offline') as 'online' | 'away' | 'busy' | 'offline',
          avatar: member.avatar || DEFAULT_AVATAR_URL,
          // 保存成员信息用于权限判断
          ...(member.memberInfo && {
            roomRole: member.memberInfo.roomRole,
            isMuted: member.memberInfo.isMuted,
            muteUntil: member.memberInfo.muteUntil,
            memberId: member.memberInfo.memberId,
          }),
        }));
        
        setUsers(members);
        console.log('聊天室成员列表（含权限信息）:', members);
      }
    } catch (err) {
      console.error('获取成员列表失败:', err);
      setUsers([]);
    }
  }, []);

  // 获取当前用户在聊天室的成员信息
  const fetchCurrentMemberInfo = useCallback(async (roomId: string) => {
    if (!user || roomId === '100000001') {
      setCurrentRoomMember(null);
      return;
    }
    
    try {
      const response = await memberService.getMemberInfo(roomId, user.userId);
      if (response.code === 200 && response.data) {
        const memberInfo: ChatRoomMember = {
          memberId: response.data.memberId,
          roomId: response.data.roomId,
          userId: response.data.userId,
          roomRole: response.data.roomRole,
          isMuted: response.data.isMuted,
          muteUntil: response.data.muteUntil,
          joinedAt: response.data.joinedAt,
          isActive: true,
        };
        setCurrentRoomMember(memberInfo);
        console.log('当前用户成员信息:', memberInfo);
      }
    } catch (err) {
      console.error('获取成员信息失败:', err);
      // 如果获取失败，设置为普通成员
      setCurrentRoomMember({
        memberId: `M_${user.userId}_${roomId}`,
        roomId: roomId,
        userId: user.userId,
        roomRole: 'member',
        isMuted: false,
        joinedAt: new Date().toISOString(),
        isActive: true,
      });
    }
  }, [user, setCurrentRoomMember]);

  // 更新用户在线状态
  const updateUserStatus = useCallback((userId: string, status: 'online' | 'away' | 'busy' | 'offline') => {
    setUsers(prev => prev.map(u => 
      u.userId === userId 
        ? { ...u, status }
        : u
    ));
  }, []);

  // 更新用户禁言状态
  const updateUserMuteStatus = useCallback((userId: string, isMuted: boolean, muteUntil?: string | null) => {
    console.log(`[useRoomMembers] ✅ updateUserMuteStatus 被调用:`, { userId, isMuted, muteUntil });
    
    setUsers(prev => {
      console.log(`[useRoomMembers] 更新前用户列表:`, prev.map(u => ({ userId: u.userId, name: u.name, isMuted: u.isMuted })));
      
      const targetUser = prev.find(u => u.userId === userId);
      if (!targetUser) {
        console.warn(`[useRoomMembers] ⚠️ 未找到用户 ${userId}`);
        return prev;
      }
      
      const updated = prev.map(u => 
        u.userId === userId 
          ? { ...u, isMuted, muteUntil }
          : u
      );
      
      console.log(`[useRoomMembers] ✅ 用户列表已更新:`, updated.map(u => ({ userId: u.userId, name: u.name, isMuted: u.isMuted })));
      console.log(`[useRoomMembers] ✅ 目标用户更新: ${targetUser.name} - isMuted: ${targetUser.isMuted} → ${isMuted}`);
      
      return updated;
    });
  }, []); // 移除users依赖，避免闭包陷阱

  // 更新用户角色
  const updateUserRole = useCallback((userId: string, roomRole: 'owner' | 'admin' | 'member') => {
    console.log(`[useRoomMembers] ✅ updateUserRole 被调用:`, { userId, roomRole });
    
    setUsers(prev => {
      const targetUser = prev.find(u => u.userId === userId);
      if (!targetUser) {
        console.warn(`[useRoomMembers] ⚠️ 未找到用户 ${userId}`);
        return prev;
      }
      
      const updated = prev.map(u => 
        u.userId === userId 
          ? { ...u, roomRole }
          : u
      );
      
      console.log(`[useRoomMembers] ✅ 用户角色已更新: ${targetUser.name} - roomRole: ${targetUser.roomRole} → ${roomRole}`);
      
      return updated;
    });
  }, []);

  // 移除用户
  const removeUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.userId !== userId));
  }, []);

  return {
    users,
    fetchRoomMembers,
    fetchCurrentMemberInfo,
    updateUserStatus,
    updateUserMuteStatus,
    updateUserRole,
    removeUser,
  };
};
