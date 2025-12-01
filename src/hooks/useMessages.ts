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
  fetchMessages: (roomId: string, force?: boolean) => Promise<void>;
  sendMessage: (roomId: string, text: string, replyTo?: string) => Promise<void>;
  addMessageToRoom: (roomId: string, message: Message) => void;
  updateMessage: (roomId: string, messageId: string, text: string) => void;
  deleteMessage: (roomId: string, messageId: string) => void;
  clearRoomCache: (roomId: string) => void;
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
  const fetchMessages = useCallback(async (roomId: string, force = false) => {
    if (!user || roomId === '100000001') {
      return;
    }
    
    // 使用 ref 检查是否已加载，避免重复请求（除非强制刷新）
    if (!force && loadedRoomsRef.current.has(roomId)) {
      console.log(`[useMessages] 聊天室 ${roomId} 消息已加载，跳过重复请求`);
      return;
    }
    
    console.log(`[useMessages] 获取聊天室 ${roomId} 的消息历史`);
    setIsLoadingMessages(true);
    try {
      const response = await messageService.getMessageHistory(roomId, { pageSize: 50 });
      console.log(`[useMessages] 消息历史响应:`, response);
      
      if (response.code === 200 && response.data) {
        // 后端返回的是 data.messages，兼容 data.list
        const messageList = response.data.messages || response.data.list || [];
        console.log(`[useMessages] 解析到的消息列表:`, messageList);
        
        if (!Array.isArray(messageList)) {
          console.warn(`[useMessages] 消息列表格式错误:`, messageList);
          setIsLoadingMessages(false);
          return;
        }
        
        // 将 MessageListItem 转换为 Message 格式
        const fetchedMessages: Message[] = messageList.map(item => ({
          messageId: item.messageId,
          roomId: item.roomId || roomId,
          userId: item.userId,
          userName: item.userName || item.nickname || item.username || '未知用户',
          importmessageId: '',
          type: item.type as Message['type'],
          text: item.text || '',
          time: item.time || item.createdTime || new Date().toISOString(),
          isOwn: item.isOwn !== undefined ? item.isOwn : (item.userId === user.userId),
        }));
        
        console.log(`[useMessages] 转换后的消息:`, fetchedMessages);
        
        // 按时间排序（从旧到新）
        fetchedMessages.sort((a, b) => {
          const timeA = new Date(a.time).getTime();
          const timeB = new Date(b.time).getTime();
          return timeA - timeB;
        });
        
        setRoomMessages(prev => ({
          ...prev,
          [roomId]: fetchedMessages,
        }));
        
        // 标记为已加载
        loadedRoomsRef.current.add(roomId);
        console.log(`[useMessages] 聊天室 ${roomId} 加载了 ${fetchedMessages.length} 条消息`);
      } else {
        console.warn(`[useMessages] 获取消息历史失败:`, response.message);
      }
    } catch (err) {
      console.error('[useMessages] 获取消息历史失败:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user]);

  // 添加新消息到聊天室（需要先定义，因为会被其他函数使用）
  const addMessageToRoom = useCallback((roomId: string, message: Message) => {
    console.log('[useMessages] 添加消息到房间:', { roomId, messageId: message.messageId });
    setRoomMessages(prev => {
      const currentMessages = prev[roomId] || [];
      
      // 检查消息是否已存在
      const exists = currentMessages.some(m => m.messageId === message.messageId);
      if (exists) {
        console.log('[useMessages] 消息已存在，跳过添加:', message.messageId);
        return prev;
      }
      
      // 如果是真实消息（非临时），检查是否需要替换临时消息
      if (!message.messageId.startsWith('temp_')) {
        // 查找可能的临时消息（同一用户、同一文本内容、时间接近）
        const tempMessageIndex = currentMessages.findIndex(m => 
          m.messageId.startsWith('temp_') && 
          m.userId === message.userId && 
          m.text === message.text &&
          Math.abs(new Date(m.time).getTime() - new Date(message.time).getTime()) < 10000 // 10秒内
        );
        
        if (tempMessageIndex !== -1) {
          console.log('[useMessages] 找到临时消息，替换为真实消息:', currentMessages[tempMessageIndex].messageId, '->', message.messageId);
          // 替换临时消息
          const updatedMessages = [...currentMessages];
          updatedMessages[tempMessageIndex] = message;
          return {
            ...prev,
            [roomId]: updatedMessages,
          };
        }
      }
      
      return {
        ...prev,
        [roomId]: [...currentMessages, message],
      };
    });
  }, []);

  // 通过 HTTP 发送消息
  const sendMessageViaHttp = useCallback(async (roomId: string, text: string, replyTo?: string) => {
    if (!user) {
      console.log('[useMessages] HTTP发送失败: 用户未登录');
      return;
    }
    
    console.log('[useMessages] 通过 HTTP 发送消息:', { roomId, text, replyTo });
    try {
      const response = await messageService.sendMessage(roomId, {
        type: 'text',
        text,
        replyToMessageId: replyTo,
      });
      console.log('[useMessages] HTTP 响应:', response);
      
      if (response.code === 200) {
        console.log('[useMessages] HTTP 发送成功');
        // 立即添加消息到本地（乐观更新）
        // 如果后续收到 WebSocket 广播的相同消息，会被去重逻辑过滤
        const messageData = response.data;
        if (messageData && messageData.messageId) {
          const newMessage: Message = {
            messageId: messageData.messageId,
            roomId: roomId,
            userId: user.userId,
            userName: user.nickname || user.username || '我',
            importmessageId: replyTo || '',
            type: 'text',
            text: text,
            time: messageData.sendTime || new Date().toISOString(),
            isOwn: true,
          };
          console.log('[useMessages] 添加本地消息:', newMessage);
          addMessageToRoom(roomId, newMessage);
        }
      } else {
        onError?.('发送失败', response.message || '无法发送消息', 2);
        throw new Error(response.message);
      }
    } catch (err) {
      const apiError = err as ApiError;
      onError?.('发送失败', apiError.message || '发送消息时发生错误', 2);
      throw err;
    }
  }, [user, onError, addMessageToRoom]);

  // 发送消息
  const sendMessage = useCallback(async (roomId: string, text: string, replyTo?: string) => {
    console.log('[useMessages] 准备发送消息:', { roomId, text, replyTo, isWSConnected: wsClient.isConnected });
    
    // 优先使用 WebSocket 发送
    if (wsClient.isConnected) {
      console.log('[useMessages] 使用 WebSocket 发送消息');
      const sent = wsClient.sendChatMessage(roomId, text, 'text', replyTo);
      console.log('[useMessages] WebSocket 发送结果:', sent);
      if (!sent) {
        // WebSocket 发送失败，回退到 HTTP
        console.log('[useMessages] WebSocket 发送失败，回退到 HTTP');
        await sendMessageViaHttp(roomId, text, replyTo);
      } else {
        // WebSocket 发送成功，立即添加临时消息（乐观更新）
        // 使用临时ID，等待服务器广播真实消息后会被替换
        const tempMessage: Message = {
          messageId: `temp_${Date.now()}_${Math.random()}`,
          roomId: roomId,
          userId: user!.userId,
          userName: user!.nickname || user!.username || '我',
          importmessageId: replyTo || '',
          type: 'text',
          text: text,
          time: new Date().toISOString(),
          isOwn: true,
        };
        console.log('[useMessages] 添加临时消息:', tempMessage);
        addMessageToRoom(roomId, tempMessage);
      }
    } else {
      // WebSocket 未连接，使用 HTTP 发送
      console.log('[useMessages] WebSocket 未连接，使用 HTTP 发送');
      await sendMessageViaHttp(roomId, text, replyTo);
    }
  }, [sendMessageViaHttp, user, addMessageToRoom]);

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

  // 清空房间缓存，用于强制刷新
  const clearRoomCache = useCallback((roomId: string) => {
    console.log(`[useMessages] 清空房间 ${roomId} 的缓存`);
    loadedRoomsRef.current.delete(roomId);
  }, []);

  return {
    roomMessages,
    isLoadingMessages,
    fetchMessages,
    sendMessage,
    addMessageToRoom,
    updateMessage,
    deleteMessage,
    clearRoomCache,
  };
};
