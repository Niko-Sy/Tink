/**
 * 聊天室管理 Hook
 * 负责聊天室列表的获取、创建、加入、更新和删除
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatRoom, ChatRoomMember, User } from '../types';
import type { ChatRoomSettings } from '../components/ChatRoomSettingsModal';
import { 
  chatroomService, 
  type ChatRoomListItem,
  type ApiError,
} from '../services';

export interface UseChatRoomsReturn {
  chatRooms: ChatRoom[];
  activeChatRoom: string;
  setActiveChatRoom: (roomId: string) => void;
  isLoadingRooms: boolean;
  handleJoinRoom: (roomId: string, password: string) => Promise<void>;
  handleCreateRoom: (name: string, description: string, password: string, type: 'public' | 'private' | 'protected') => Promise<void>;
  handleSaveSettings: (settings: ChatRoomSettings) => Promise<void>;
  handleDeleteRoom: () => Promise<void>;
  getCurrentRoomSettings: () => ChatRoomSettings;
  updateRoomUnread: (roomId: string, increment: number) => void;
  clearRoomUnread: (roomId: string) => void;
  removeRoom: (roomId: string) => void;
}

interface UseChatRoomsOptions {
  user: User | null;
  setCurrentRoomMember: (member: ChatRoomMember | null) => void;
  onSuccess?: (message: string, description: string | React.ReactNode, duration?: number) => void;
  onError?: (message: string, description: string, duration?: number) => void;
  onWarning?: (message: string, description: string, duration?: number) => void;
}

// 将 ChatRoomListItem 转换为 ChatRoom
const convertToChatRoom = (item: ChatRoomListItem): ChatRoom => ({
  roomId: item.roomId,
  name: item.name,
  description: item.description,
  icon: item.icon || 'fas fa-comments',
  type: item.type,
  onlineCount: item.onlineCount,
  peopleCount: item.peopleCount,
  createdTime: item.createdTime,
  lastMessageTime: item.lastMessageTime,
  unread: item.unreadCount ?? (item as unknown as { unread?: number }).unread ?? 0,
});

export const useChatRooms = ({
  user,
  setCurrentRoomMember,
  onSuccess,
  onError,
  onWarning,
}: UseChatRoomsOptions): UseChatRoomsReturn => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([
    { 
      roomId: '100000001',
      name: '主页', 
      description: '聊天室主页',
      icon: 'fas fa-home', 
      type: 'public',
      onlineCount: 0,
      peopleCount: 0,
      createdTime: new Date().toISOString(),
      lastMessageTime: new Date().toISOString(),
      unread: 0 
    },
  ]);

  const [activeChatRoom, setActiveChatRoom] = useState('100000001');
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const hasInitializedRef = useRef(false);

  // 初始化：获取聊天室列表
  useEffect(() => {
    const initChatRooms = async () => {
      if (!user || hasInitializedRef.current) return;
      
      setIsLoadingRooms(true);
      try {
        const response = await chatroomService.getMyChatRooms(1, 100);
        if (response.code === 200 && response.data) {
          const rawData = response.data as { list?: ChatRoomListItem[]; chatrooms?: ChatRoomListItem[] } | ChatRoomListItem[];
          let roomList: ChatRoomListItem[] = [];
          
          if (Array.isArray(rawData)) {
            roomList = rawData;
          } else if (rawData.chatrooms && Array.isArray(rawData.chatrooms)) {
            roomList = rawData.chatrooms;
          } else if (rawData.list && Array.isArray(rawData.list)) {
            roomList = rawData.list;
          }
          
          const rooms = roomList.map(convertToChatRoom);
          
          const allRooms = [
            { 
              roomId: '100000001',
              name: '主页', 
              description: '聊天室主页',
              icon: 'fas fa-home', 
              type: 'public' as const,
              onlineCount: 0,
              peopleCount: 0,
              createdTime: new Date().toISOString(),
              lastMessageTime: new Date().toISOString(),
              unread: 0 
            },
            ...rooms
          ];
          console.log('初始化聊天室列表:', allRooms);
          setChatRooms(allRooms);
          
          if (rooms.length > 0) {
            setActiveChatRoom(rooms[0].roomId);
          }
          
          hasInitializedRef.current = true;
        }
      } catch (err) {
        console.error('获取聊天室列表失败:', err);
      } finally {
        setIsLoadingRooms(false);
      }
    };
    
    initChatRooms();
  }, [user]);

  // 处理加入聊天室
  const handleJoinRoom = useCallback(async (roomId: string, password: string) => {
    if (!chatroomService.validateRoomId(roomId)) {
      onError?.('加入失败', '聊天室ID必须是9位数字！', 2);
      return;
    }
    
    if (chatRooms.some(room => room.roomId === roomId)) {
      onWarning?.('已加入', '你已经在这个聊天室中了', 2);
      setActiveChatRoom(roomId);
      return;
    }
    
    try {
      const response = await chatroomService.joinRoom({ roomId, password: password || undefined });
      
      if (response.code === 200 && response.data) {
        const chatroomData = response.data.chatroom;
        const newRoom: ChatRoom = {
          roomId: chatroomData.roomId,
          name: chatroomData.name,
          description: chatroomData.description,
          icon: chatroomData.icon || 'fas fa-comments',
          type: chatroomData.type,
          onlineCount: chatroomData.onlineCount || 0,
          peopleCount: chatroomData.peopleCount || 1,
          createdTime: chatroomData.createdTime,
          lastMessageTime: chatroomData.lastMessageTime || chatroomData.createdTime,
          unread: 0,
        };
        
        setChatRooms(prev => [...prev, newRoom]);
        
        const memberInfo = response.data.memberInfo;
        setCurrentRoomMember({
          memberId: memberInfo.memberId,
          roomId: memberInfo.roomId,
          userId: memberInfo.userId,
          roomRole: memberInfo.roomRole,
          isMuted: memberInfo.isMuted,
          muteUntil: memberInfo.muteExpireAt,
          joinedAt: memberInfo.joinedAt,
          isActive: memberInfo.isActive,
        });
        
        setActiveChatRoom(newRoom.roomId);
        
        onSuccess?.('成功加入聊天室', `已加入聊天室 ${newRoom.name}`, 2);
      } else {
        onError?.('加入失败', response.message || '无法加入聊天室', 2);
      }
    } catch (err) {
      const apiError = err as ApiError;
      onError?.('加入失败', apiError.message || '加入聊天室时发生错误', 2);
    }
  }, [chatRooms, setCurrentRoomMember, onSuccess, onError, onWarning]);

  // 处理创建聊天室
  const handleCreateRoom = useCallback(async (
    name: string, 
    description: string, 
    password: string, 
    type: 'public' | 'private' | 'protected' = 'public'
  ) => {
    try {
      const response = await chatroomService.createRoom({
        name,
        description,
        type,
        password: type === 'protected' ? password : undefined,
        icon: 'fas fa-comments',
      });
      
      if (response.code === 200 && response.data) {
        const chatroomData = response.data.chatroom;
        const newRoom: ChatRoom = {
          roomId: chatroomData.roomId,
          name: chatroomData.name,
          description: chatroomData.description,
          icon: chatroomData.icon || 'fas fa-comments',
          type: chatroomData.type,
          onlineCount: chatroomData.onlineCount || 1,
          peopleCount: chatroomData.peopleCount || 1,
          createdTime: chatroomData.createdTime,
          lastMessageTime: chatroomData.lastMessageTime || chatroomData.createdTime,
          unread: 0,
        };
        
        setChatRooms(prev => [...prev, newRoom]);
        
        const memberInfo = response.data.memberInfo;
        setCurrentRoomMember({
          memberId: memberInfo.memberId,
          roomId: memberInfo.roomId,
          userId: memberInfo.userId,
          roomRole: memberInfo.roomRole,
          isMuted: memberInfo.isMuted,
          muteUntil: memberInfo.muteExpireAt,
          joinedAt: memberInfo.joinedAt,
          isActive: memberInfo.isActive,
        });
        
        setActiveChatRoom(newRoom.roomId);
        
        navigator.clipboard.writeText(newRoom.roomId).then(() => {
          onSuccess?.(
            '聊天室创建成功',
            `聊天室ID: ${newRoom.roomId}\n✓ ID已复制到剪贴板，请妥善保管密码`,
            4
          );
        }).catch(() => {
          onSuccess?.(
            '聊天室创建成功',
            `聊天室ID: ${newRoom.roomId}\n⚠ 请手动复制聊天室ID`,
            4
          );
        });
      } else {
        onError?.('创建失败', response.message || '无法创建聊天室', 2);
      }
    } catch (err) {
      const apiError = err as ApiError;
      onError?.('创建失败', apiError.message || '创建聊天室时发生错误', 2);
    }
  }, [setCurrentRoomMember, onSuccess, onError]);

  // 处理聊天室设置保存
  const handleSaveSettings = useCallback(async (settings: ChatRoomSettings) => {
    try {
      const response = await chatroomService.updateRoom(activeChatRoom, {
        name: settings.name,
        description: settings.description,
        type: settings.type,
        password: settings.password || undefined,
        icon: settings.icon,
      });
      
      if (response.code === 200) {
        setChatRooms(prev => prev.map(room => 
          room.roomId === activeChatRoom 
            ? { ...room, name: settings.name, icon: settings.icon, description: settings.description, type: settings.type }
            : room
        ));
        
        onSuccess?.('✓ 设置保存成功', '聊天室信息已更新', 2);
      } else {
        onError?.('保存失败', response.message || '无法保存设置', 2);
      }
    } catch (err) {
      const apiError = err as ApiError;
      onError?.('保存失败', apiError.message || '保存设置时发生错误', 2);
    }
  }, [activeChatRoom, onSuccess, onError]);

  // 处理解散聊天室
  const handleDeleteRoom = useCallback(async () => {
    try {
      const response = await chatroomService.deleteRoom(activeChatRoom);
      
      if (response.code === 200) {
        setChatRooms(prev => prev.filter(room => room.roomId !== activeChatRoom));
        setActiveChatRoom('100000001');
        onSuccess?.('聊天室已解散', '聊天室已成功解散', 2);
      } else {
        onError?.('解散失败', response.message || '无法解散聊天室', 2);
      }
    } catch (err) {
      const apiError = err as ApiError;
      onError?.('解散失败', apiError.message || '解散聊天室时发生错误', 2);
    }
  }, [activeChatRoom, onSuccess, onError]);

  // 获取当前聊天室设置
  const getCurrentRoomSettings = useCallback((): ChatRoomSettings => {
    const currentRoom = chatRooms.find(room => room.roomId === activeChatRoom);
    return {
      name: currentRoom?.name || '',
      description: currentRoom?.description || '',
      icon: currentRoom?.icon || 'fas fa-comments',
      type: currentRoom?.type || 'public',
      password: '',
    };
  }, [chatRooms, activeChatRoom]);

  // 更新聊天室未读数
  const updateRoomUnread = useCallback((roomId: string, increment: number) => {
    setChatRooms(prev => prev.map(room => 
      room.roomId === roomId 
        ? { ...room, unread: room.unread + increment }
        : room
    ));
  }, []);

  // 清除聊天室未读数
  const clearRoomUnread = useCallback((roomId: string) => {
    setChatRooms(prev => prev.map(room => 
      room.roomId === roomId 
        ? { ...room, unread: 0 }
        : room
    ));
  }, []);

  // 移除聊天室
  const removeRoom = useCallback((roomId: string) => {
    setChatRooms(prev => prev.filter(room => room.roomId !== roomId));
    if (activeChatRoom === roomId) {
      setActiveChatRoom('100000001');
    }
  }, [activeChatRoom]);

  return {
    chatRooms,
    activeChatRoom,
    setActiveChatRoom,
    isLoadingRooms,
    handleJoinRoom,
    handleCreateRoom,
    handleSaveSettings,
    handleDeleteRoom,
    getCurrentRoomSettings,
    updateRoomUnread,
    clearRoomUnread,
    removeRoom,
  };
};
