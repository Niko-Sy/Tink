/**
 * WebSocket Hook
 * 提供 React 组件中使用 WebSocket 的便捷方式
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { wsClient } from '../services/websocket';
import type { WSEventHandler, WSNewMessage, WSUserStatus, WSRoomMember, WSMute } from '../services/websocket';

// ==================== Hook 返回类型 ====================

export interface UseWebSocketReturn {
  // 连接状态
  isConnected: boolean;
  
  // 连接控制
  connect: () => void;
  disconnect: () => void;
  
  // 发送消息
  sendMessage: (roomId: string, text: string, type?: 'text' | 'image' | 'file') => boolean;
}

// ==================== 主 Hook ====================

/**
 * useWebSocket - WebSocket 连接管理 Hook
 * 
 * @param autoConnect - 是否在挂载时自动连接，默认 true
 */
export const useWebSocket = (autoConnect: boolean = true): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(wsClient.isConnected);
  
  useEffect(() => {
    // 监听连接状态
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    
    wsClient.on('connected', handleConnected);
    wsClient.on('disconnected', handleDisconnected);
    
    // 自动连接
    if (autoConnect && !wsClient.isConnected) {
      wsClient.connect();
    }
    
    return () => {
      wsClient.off('connected', handleConnected);
      wsClient.off('disconnected', handleDisconnected);
    };
  }, [autoConnect]);
  
  const connect = useCallback(() => {
    wsClient.connect();
  }, []);
  
  const disconnect = useCallback(() => {
    wsClient.disconnect();
  }, []);
  
  const sendMessage = useCallback((
    roomId: string,
    text: string,
    type: 'text' | 'image' | 'file' = 'text'
  ): boolean => {
    return wsClient.sendChatMessage(roomId, text, type);
  }, []);
  
  return {
    isConnected,
    connect,
    disconnect,
    sendMessage,
  };
};

// ==================== 事件监听 Hooks ====================

/**
 * useWSMessage - 监听新消息事件
 */
export const useWSMessage = (
  callback: (message: WSNewMessage) => void,
  deps: React.DependencyList = []
): void => {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    const handler: WSEventHandler<WSNewMessage> = (data) => {
      savedCallback.current(data);
    };
    
    wsClient.on('message', handler);
    
    return () => {
      wsClient.off('message', handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

/**
 * useWSUserStatus - 监听用户状态变化
 */
export const useWSUserStatus = (
  callback: (data: WSUserStatus) => void,
  deps: React.DependencyList = []
): void => {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    const handler: WSEventHandler<WSUserStatus> = (data) => {
      savedCallback.current(data);
    };
    
    wsClient.on('user_status', handler);
    
    return () => {
      wsClient.off('user_status', handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

/**
 * useWSRoomMember - 监听聊天室成员变动
 */
export const useWSRoomMember = (
  callback: (data: WSRoomMember) => void,
  deps: React.DependencyList = []
): void => {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    const handler: WSEventHandler<WSRoomMember> = (data) => {
      savedCallback.current(data);
    };
    
    wsClient.on('room_member', handler);
    
    return () => {
      wsClient.off('room_member', handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

/**
 * useWSMute - 监听禁言通知
 */
export const useWSMute = (
  callback: (data: WSMute) => void,
  deps: React.DependencyList = []
): void => {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    const handler: WSEventHandler<WSMute> = (data) => {
      savedCallback.current(data);
    };
    
    wsClient.on('mute', handler);
    
    return () => {
      wsClient.off('mute', handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

/**
 * useWSConnection - 监听连接状态变化
 */
export const useWSConnection = (
  onConnected?: () => void,
  onDisconnected?: () => void,
  onReconnecting?: (data: { attempt: number; delay: number }) => void,
  deps: React.DependencyList = []
): void => {
  useEffect(() => {
    if (onConnected) {
      wsClient.on('connected', onConnected);
    }
    if (onDisconnected) {
      wsClient.on('disconnected', onDisconnected);
    }
    if (onReconnecting) {
      wsClient.on('reconnecting', onReconnecting);
    }
    
    return () => {
      if (onConnected) wsClient.off('connected', onConnected);
      if (onDisconnected) wsClient.off('disconnected', onDisconnected);
      if (onReconnecting) wsClient.off('reconnecting', onReconnecting);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export default useWebSocket;
