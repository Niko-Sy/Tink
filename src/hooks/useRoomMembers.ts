/**
 * 聊天室成员管理 Hook
 * 负责获取和管理聊天室成员列表
 */

import { useState, useCallback } from 'react';
import type { User, ChatRoomMember } from '../types';
import { memberService } from '../services';

export interface UseRoomMembersReturn {
  users: User[];
  fetchRoomMembers: (roomId: string) => Promise<void>;
  fetchCurrentMemberInfo: (roomId: string) => Promise<void>;
  updateUserStatus: (userId: string, status: 'online' | 'away' | 'busy' | 'offline') => void;
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
          avatar: member.avatar || 'https://ai-public.mastergo.com/ai/img_res/3b71fa6479b687f7aac043084415c2d8.jpg',
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

  // 移除用户
  const removeUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.userId !== userId));
  }, []);

  return {
    users,
    fetchRoomMembers,
    fetchCurrentMemberInfo,
    updateUserStatus,
    removeUser,
  };
};
