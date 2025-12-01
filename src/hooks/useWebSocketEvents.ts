/**
 * WebSocket 事件处理 Hook
 * 负责处理 WebSocket 消息、用户状态变化和成员变动
 */

import { useEffect } from 'react';
import type { User, Message } from '../types';
import { 
  wsClient,
  type WSNewMessage,
  type WSUserStatus,
  type WSRoomMember,
} from '../services';

export interface UseWebSocketEventsOptions {
  user: User | null;
  activeChatRoom: string;
  addMessageToRoom: (roomId: string, message: Message) => void;
  updateMessage: (roomId: string, messageId: string, text: string) => void;
  deleteMessage: (roomId: string, messageId: string) => void;
  updateRoomUnread: (roomId: string, increment: number) => void;
  updateUserStatus: (userId: string, status: 'online' | 'away' | 'busy' | 'offline') => void;
  fetchRoomMembers: (roomId: string) => Promise<void>;
  removeUser: (userId: string) => void;
  removeRoom: (roomId: string) => void;
  onWarning?: (message: string, description: string, duration?: number) => void;
}

export const useWebSocketEvents = ({
  user,
  activeChatRoom,
  addMessageToRoom,
  updateMessage,
  deleteMessage,
  updateRoomUnread,
  updateUserStatus,
  fetchRoomMembers,
  removeUser,
  removeRoom,
  onWarning,
}: UseWebSocketEventsOptions) => {
  useEffect(() => {
    if (!user) return;

    // 处理新消息
    const handleNewMessage = (wsMessage: WSNewMessage) => {
      console.log('[useWebSocketEvents] 收到 WebSocket 消息:', wsMessage);
      const { data, action } = wsMessage;
      
      if (action === 'new') {
        console.log('[useWebSocketEvents] 处理新消息:', data);
        const newMessage: Message = {
          messageId: data.messageId,
          roomId: data.roomId,
          userId: data.userId,
          userName: data.userName || data.nickname || '未知用户',
          importmessageId: data.quotedMessageId || '',  // 使用 quotedMessageId
          type: data.type || data.messageType || 'text',  // 可能是 type 或 messageType
          text: data.text || '',
          time: data.time || data.createdTime || new Date().toISOString(),
          isOwn: data.userId === user.userId,
        };
        addMessageToRoom(data.roomId, newMessage);
        
        // 如果不是当前聊天室的消息，增加未读数
        if (data.roomId !== activeChatRoom) {
          updateRoomUnread(data.roomId, 1);
        }
      } else if (action === 'deleted') {  // 根据文档，action 是 'deleted'
        console.log('[useWebSocketEvents] 处理消息删除:', data);
        deleteMessage(data.roomId, data.messageId);
      } else if (action === 'edited') {  // 根据文档，action 是 'edited'
        console.log('[useWebSocketEvents] 处理消息编辑:', data);
        updateMessage(data.roomId, data.messageId, data.text || '');
      }
    };

    // 处理用户状态变化
    const handleUserStatus = (wsMessage: WSUserStatus) => {
      const { data } = wsMessage;
      updateUserStatus(data.userId, data.onlineStatus);
    };

    // 处理成员变动
    const handleRoomMember = (wsMessage: WSRoomMember) => {
      const { data } = wsMessage;
      
      if (data.action === 'join') {
        // 有新成员加入，刷新成员列表
        if (data.roomId === activeChatRoom) {
          fetchRoomMembers(data.roomId);
        }
      } else if (data.action === 'leave' || data.action === 'kick') {
        // 成员离开或被踢出
        if (data.userId === user.userId) {
          // 如果是自己被踢出
          removeRoom(data.roomId);
          onWarning?.(
            data.action === 'kick' ? '你已被移出聊天室' : '你已离开聊天室',
            data.reason || '',
            3
          );
        } else {
          // 其他成员离开
          removeUser(data.userId);
        }
      }
    };

    // 注册 WebSocket 事件监听
    wsClient.on('message', handleNewMessage);
    wsClient.on('user_status', handleUserStatus);
    wsClient.on('room_member', handleRoomMember);

    return () => {
      wsClient.off('message', handleNewMessage);
      wsClient.off('user_status', handleUserStatus);
      wsClient.off('room_member', handleRoomMember);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, activeChatRoom]); // 只依赖不会频繁变化的值
};
