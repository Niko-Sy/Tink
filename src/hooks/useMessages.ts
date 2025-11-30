/**
 * 消息管理 Hook
 * 负责消息的获取、发送和管理
 */

import { useState, useCallback, useRef } from 'react';
import type { Message, User } from '../types';
import { 
  messageService,
  wsClient,
  type ApiError,
} from '../services';

export interface UseMessagesReturn {
  roomMessages: Record<string, Message[]>;
  isLoadingMessages: boolean;
  fetchMessages: (roomId: string) => Promise<void>;
  sendMessage: (roomId: string, text: string) => Promise<void>;
  addMessageToRoom: (roomId: string, message: Message) => void;
  updateMessage: (roomId: string, messageId: string, text: string) => void;
  deleteMessage: (roomId: string, messageId: string) => void;
}

interface UseMessagesOptions {
  user: User | null;
  onError?: (message: string, description: string, duration?: number) => void;
}

export const useMessages = ({
  user,
  onError,
}: UseMessagesOptions): UseMessagesReturn => {
  const [roomMessages, setRoomMessages] = useState<Record<string, Message[]>>({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const loadedRoomsRef = useRef<Set<string>>(new Set());

  // 获取聊天室消息历史
  const fetchMessages = useCallback(async (roomId: string) => {
    if (!user || roomId === '100000001') {
      return;
    }
    
    // 使用 ref 检查是否已加载，避免重复请求
    if (loadedRoomsRef.current.has(roomId)) {
      return;
    }
    
    // 标记为已加载
    loadedRoomsRef.current.add(roomId);
    
    setIsLoadingMessages(true);
    try {
      const response = await messageService.getMessageHistory(roomId, { pageSize: 50 });
      if (response.code === 200 && response.data) {
        const list = response.data.list || response.data as unknown as Array<Parameters<typeof messageService.toMessage>[0]>;
        const messageList = Array.isArray(list) ? list : [];
        const fetchedMessages: Message[] = messageList.map(item => 
          messageService.toMessage(item, user.userId)
        );
        // 消息按时间正序排列
        setRoomMessages(prev => ({
          ...prev,
          [roomId]: fetchedMessages.reverse(),
        }));
        console.log(`聊天室 ${roomId} 消息历史:`, fetchedMessages);
      }
    } catch (err) {
      console.error('获取消息历史失败:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user]);

  // 通过 HTTP 发送消息
  const sendMessageViaHttp = useCallback(async (roomId: string, text: string) => {
    if (!user) return;
    
    try {
      const response = await messageService.sendMessage(roomId, {
        type: 'text',
        text,
      });
      
      if (response.code === 200 && response.data) {
        const newMessage: Message = {
          messageId: response.data.messageId,
          roomId: roomId,
          userId: user.userId,
          userName: user.nickname || user.username || user.name,
          importmessageId: '',
          type: 'text',
          text: text,
          time: messageService.formatMessageTime(response.data.sendTime),
          isOwn: true,
        };
        
        setRoomMessages(prev => ({
          ...prev,
          [roomId]: [...(prev[roomId] || []), newMessage],
        }));
      } else {
        onError?.('发送失败', response.message || '无法发送消息', 2);
        throw new Error(response.message);
      }
    } catch (err) {
      const apiError = err as ApiError;
      onError?.('发送失败', apiError.message || '发送消息时发生错误', 2);
      throw err;
    }
  }, [user, onError]);

  // 发送消息
  const sendMessage = useCallback(async (roomId: string, text: string) => {
    // 优先使用 WebSocket 发送
    if (wsClient.isConnected) {
      const sent = wsClient.sendChatMessage(roomId, text, 'text');
      if (!sent) {
        // WebSocket 发送失败，回退到 HTTP
        await sendMessageViaHttp(roomId, text);
      }
      // WebSocket 发送成功后，消息会通过 WebSocket 回调添加到列表
    } else {
      // WebSocket 未连接，使用 HTTP 发送
      await sendMessageViaHttp(roomId, text);
    }
  }, [sendMessageViaHttp]);

  // 添加新消息到聊天室
  const addMessageToRoom = useCallback((roomId: string, message: Message) => {
    setRoomMessages(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), message],
    }));
  }, []);

  // 更新消息
  const updateMessage = useCallback((roomId: string, messageId: string, text: string) => {
    setRoomMessages(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || []).map(m => 
        m.messageId === messageId 
          ? { ...m, text }
          : m
      ),
    }));
  }, []);

  // 删除消息
  const deleteMessage = useCallback((roomId: string, messageId: string) => {
    setRoomMessages(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || []).filter(m => m.messageId !== messageId),
    }));
  }, []);

  return {
    roomMessages,
    isLoadingMessages,
    fetchMessages,
    sendMessage,
    addMessageToRoom,
    updateMessage,
    deleteMessage,
  };
};
