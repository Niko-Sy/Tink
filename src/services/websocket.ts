/**
 * WebSocket 客户端
 * - 连接管理（建立、断开、重连）
 * - 心跳保活
 * - 消息收发
 * - 事件监听
 */

import { config, tokenManager } from './api';

// ==================== 消息类型定义 ====================

// 基础消息格式
export interface WSMessage {
  type: string;
  timestamp?: string;
  data?: unknown;
}

// 客户端发送的消息类型
export interface WSSendMessage extends WSMessage {
  type: 'message' | 'ping';
  data?: {
    roomId?: string;
    text?: string;
    messageType?: 'text' | 'image' | 'file';
    replyTo?: string;
  };
}

// 服务端推送的消息类型
export type WSMessageType =
  | 'message'      // 新消息/消息编辑/消息删除
  | 'user_status'  // 用户上下线
  | 'room_member'  // 成员变动
  | 'mute'         // 禁言通知
  | 'pong'         // 心跳响应
  | 'error';       // 错误消息

// 新消息通知
export interface WSNewMessage {
  type: 'message';
  data: {
    action: 'new' | 'edit' | 'delete';
    messageId: string;
    roomId: string;
    userId: string;
    nickname: string;
    avatar: string;
    messageType?: 'text' | 'image' | 'file' | 'system';
    text?: string;
    createdTime?: string;
    editedTime?: string;
    isEdited?: boolean;
  };
}

// 用户状态变化
export interface WSUserStatus {
  type: 'user_status';
  data: {
    userId: string;
    nickname: string;
    onlineStatus: 'online' | 'away' | 'busy' | 'offline';
    roomId?: string;
  };
}

// 成员变动
export interface WSRoomMember {
  type: 'room_member';
  data: {
    action: 'join' | 'leave' | 'kick';
    roomId: string;
    userId: string;
    nickname: string;
    operatorId?: string;
    reason?: string;
  };
}

// 禁言通知
export interface WSMute {
  type: 'mute';
  data: {
    action: 'mute' | 'unmute';
    roomId: string;
    userId: string;
    operatorId: string;
    muteUntil?: string;
    reason?: string;
  };
}

// 错误消息
export interface WSError {
  type: 'error';
  timestamp: string;
  data: {
    message: string;
    code?: number;
  };
}

// 事件处理器类型
export type WSEventHandler<T = unknown> = (data: T) => void;

// ==================== WebSocket 客户端类 ====================

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;  // 初始重连延迟 3s
  private heartbeatDelay = 30000; // 心跳间隔 30s
  private isManualClose = false;
  
  // 事件监听器
  private eventHandlers: Map<string, Set<WSEventHandler>> = new Map();
  
  // 连接状态
  private _isConnected = false;
  
  get isConnected(): boolean {
    return this._isConnected;
  }
  
  /**
   * 建立 WebSocket 连接
   */
  connect(token?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] 已连接，忽略重复连接');
      return;
    }
    
    const authToken = token || tokenManager.getToken();
    if (!authToken) {
      console.error('[WebSocket] 无 Token，无法连接');
      this.emit('error', { message: '未登录，无法建立连接' });
      return;
    }
    
    this.isManualClose = false;
    const wsUrl = `${config.wsURL}?token=${authToken}`;
    
    console.log('[WebSocket] 正在连接...', wsUrl.replace(authToken, '***'));
    
    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventListeners();
    } catch (error) {
      console.error('[WebSocket] 连接创建失败:', error);
      this.scheduleReconnect();
    }
  }
  
  /**
   * 设置 WebSocket 事件监听
   */
  private setupEventListeners(): void {
    if (!this.ws) return;
    
    this.ws.onopen = () => {
      console.log('[WebSocket] 连接成功');
      this._isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 3000;
      this.startHeartbeat();
      this.emit('connected', null);
    };
    
    this.ws.onclose = (event) => {
      console.log('[WebSocket] 连接关闭:', event.code, event.reason);
      this._isConnected = false;
      this.stopHeartbeat();
      this.emit('disconnected', { code: event.code, reason: event.reason });
      
      if (!this.isManualClose) {
        this.scheduleReconnect();
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('[WebSocket] 连接错误:', error);
      this.emit('error', { message: '连接发生错误' });
    };
    
    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }
  
  /**
   * 处理接收到的消息
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as WSMessage;
      
      // 心跳响应
      if (message.type === 'pong') {
        return;
      }
      
      console.log('[WebSocket] 收到消息:', message.type);
      
      // 触发对应类型的事件
      this.emit(message.type, message);
      
      // 同时触发通用消息事件
      this.emit('message', message);
      
    } catch (error) {
      console.error('[WebSocket] 消息解析失败:', error);
    }
  }
  
  /**
   * 发送消息
   */
  send(message: WSSendMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] 连接未就绪，无法发送消息');
      return false;
    }
    
    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('[WebSocket] 发送消息失败:', error);
      return false;
    }
  }
  
  /**
   * 发送聊天消息
   */
  sendChatMessage(
    roomId: string,
    text: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    replyTo?: string
  ): boolean {
    return this.send({
      type: 'message',
      data: {
        roomId,
        text,
        messageType,
        replyTo,
      },
    });
  }
  
  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, this.heartbeatDelay);
  }
  
  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] 达到最大重连次数，停止重连');
      this.emit('reconnect_failed', null);
      return;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000);
    
    console.log(`[WebSocket] ${delay / 1000}秒后尝试第 ${this.reconnectAttempts} 次重连...`);
    
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  /**
   * 断开连接
   */
  disconnect(): void {
    console.log('[WebSocket] 主动断开连接');
    this.isManualClose = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this._isConnected = false;
  }
  
  /**
   * 添加事件监听器
   */
  on<T = unknown>(event: string, handler: WSEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as WSEventHandler);
  }
  
  /**
   * 移除事件监听器
   */
  off<T = unknown>(event: string, handler: WSEventHandler<T>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler as WSEventHandler);
    }
  }
  
  /**
   * 触发事件
   */
  private emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[WebSocket] 事件处理器错误 (${event}):`, error);
        }
      });
    }
  }
  
  /**
   * 移除所有事件监听器
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.clear();
    }
  }
}

// ==================== 单例导出 ====================

// 创建全局单例
export const wsClient = new WebSocketClient();

export default wsClient;
