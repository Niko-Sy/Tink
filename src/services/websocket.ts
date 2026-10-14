/**
 * WebSocket 客户端
 * - 连接管理（建立、断开、重连）
 * - 心跳保活
 * - 消息收发
 * - 事件监听
 */

import {
  config,
  tokenManager,
  apiRequest,
  refreshAccessToken,
  tokenActor,
} from "./api";
import {
  WEBSOCKET_RECONNECT_DELAY,
  WEBSOCKET_MAX_RECONNECT_ATTEMPTS,
  WEBSOCKET_HEARTBEAT_INTERVAL,
} from "../config/constants";
import logger from "../utils/logger";
import type { DirectMessage, DirectSendInput } from "../types/direct";

// ==================== 消息类型定义 ====================

// 基础消息格式
export interface WSMessage {
  type: string;
  timestamp?: string;
  data?: unknown;
}

// 客户端发送的消息类型
export interface WSSendMessage extends WSMessage {
  type: "message" | "ping" | "room" | "user_status" | "typing";
  action?: "send" | "read" | "join" | "leave" | "update";
  data?: {
    clientMessageId?: string;
    roomId?: string;
    text?: string;
    messageType?: "text" | "image" | "file";
    quotedMessageId?: string; // 引用消息ID（回复功能）
    mediaUrl?: string; // 媒体文件URL
    messageId?: string; // 消息ID（已读功能）
    typing?: boolean;
    status?: "online" | "away" | "busy" | "offline";
  };
}

// 服务端推送的消息类型
export type WSMessageType =
  | "message" // 新消息/消息编辑/消息删除
  | "user_status" // 用户上下线
  | "room_member" // 成员变动
  | "room" // 房间操作响应
  | "typing" // 正在输入
  | "notification" // 系统通知（包括禁言通知）
  | "pong" // 心跳响应
  | "error"; // 错误消息

// 新消息通知（根据 API 文档）
export interface WSNewMessage {
  type: "message";
  action: "new" | "deleted" | "edited"; // 根据文档定义，action 在顶层
  data: {
    messageId: string;
    roomId: string;
    userId: string;
    memberId?: string; // 成员ID（用于系统通知消息，格式：M_U100000003_100000004）
    userName?: string; // 用户名
    nickname?: string; // 昵称（备用）
    avatarUrl?: string; // 头像URL
    avatar?: string; // 头像（备用字段）
    type?: "text" | "image" | "file" | "system_notification"; // 消息类型字段名
    messageType?: "text" | "image" | "file" | "system_notification"; // 备用字段名
    text?: string;
    mediaUrl?: string; // 媒体文件URL
    quotedMessageId?: string; // 引用的消息ID
    time?: string; // 时间字段
    createdTime?: string; // 创建时间（备用）
    editedTime?: string; // 编辑时间
    timestamp?: string; // 时间戳（备用）
    isEdited?: boolean;
    reason?: string; // 删除/编辑原因
  };
}

// 用户状态变化
export interface WSUserStatus {
  type: "user_status";
  data: {
    userId: string;
    nickname: string;
    onlineStatus: "online" | "away" | "busy" | "offline";
    roomId?: string;
  };
}

// 成员变动（根据API文档，action在顶层）
export interface WSRoomMember {
  type: "room_member";
  action: "joined" | "left" | "kicked"; // action在顶层
  data: {
    roomId: string;
    userId: string;
    nickname?: string;
    operatorId?: string;
    reason?: string;
    timestamp?: string;
  };
}

// 系统通知（包括禁言通知）
export interface WSNotification {
  type: "notification";
  action: "muted" | "unmuted"; // 禁言/解除禁言
  data: {
    roomId: string;
    userId?: string; // 被禁言的用户ID（可能为空，表示当前用户）
    operatorId?: string; // 操作者ID
    muteUntil?: string; // 禁言到期时间（ISO 8601格式）
    duration?: number; // 禁言时长（秒），-1表示永久
    permanent?: boolean; // 是否永久禁言（可选）
    reason?: string; // 禁言原因
    timestamp?: string;
  };
}

// 禁言通知（保留用于向后兼容）
export interface WSMute {
  type: "mute";
  action: "muted" | "unmuted";
  data: {
    roomId: string;
    userId?: string;
    operatorId?: string;
    muteUntil?: string;
    duration?: string;
    reason?: string;
    timestamp?: string;
  };
}

// 错误消息
export interface WSError {
  type: "error";
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
  private maxReconnectAttempts = WEBSOCKET_MAX_RECONNECT_ATTEMPTS;
  private reconnectDelay = WEBSOCKET_RECONNECT_DELAY;
  private heartbeatDelay = WEBSOCKET_HEARTBEAT_INTERVAL;
  private isManualClose = false;

  // 事件监听器
  private eventHandlers: Map<string, Set<WSEventHandler>> = new Map();

  // 连接状态
  private pendingDirect = new Map<
    string,
    {
      room: string;
      resolve: (message: DirectMessage) => void;
      reject: (error: unknown) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  private cancelPending(error: unknown): void {
    for (const pending of this.pendingDirect.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pendingDirect.clear();
  }
  sendDirectMessage(
    room: string,
    input: DirectSendInput,
  ): Promise<DirectMessage> {
    if (!this.isConnected)
      return Promise.reject({ transportUnknown: true, message: "连接不可用" });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingDirect.delete(input.clientMessageId);
        reject({ transportUnknown: true, message: "发送确认超时" });
      }, 5000);
      this.pendingDirect.set(input.clientMessageId, {
        room,
        resolve,
        reject,
        timer,
      });
      if (
        !this.send({
          type: "message",
          action: "send",
          data: {
            roomId: room,
            messageType: "text",
            text: input.text,
            clientMessageId: input.clientMessageId,
            quotedMessageId: input.quotedMessageId,
          },
        })
      ) {
        clearTimeout(timer);
        this.pendingDirect.delete(input.clientMessageId);
        reject({ transportUnknown: true, message: "连接不可用" });
      }
    });
  }
  private _isConnected = false;
  private pendingConnect = false;
  private connectionEpoch = 0;

  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * 建立 WebSocket 连接
   */
  connect(token?: string): void {
    if (
      this.pendingConnect ||
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    )
      return;
    if (!token && !tokenManager.getToken()) return;
    this.pendingConnect = true;
    this.isManualClose = false;
    const epoch = ++this.connectionEpoch;
    void (async () => {
      try {
        if (tokenManager.isTokenExpired()) await refreshAccessToken();
        const actorToken = tokenActor(token ?? tokenManager.getToken());
        const result = await apiRequest.post<{
          ticket: string;
          expiresAt: string;
        }>("/auth/ws-ticket", {});
        if (
          epoch !== this.connectionEpoch ||
          this.isManualClose ||
          actorToken !== tokenActor(token ?? tokenManager.getToken())
        )
          return;
        this.ws = new WebSocket(
          `${config.wsURL}?ticket=${encodeURIComponent(result.data.ticket)}`,
        );
        this.setupEventListeners();
      } catch {
        if (epoch === this.connectionEpoch && !this.isManualClose)
          this.scheduleReconnect();
      } finally {
        if (epoch === this.connectionEpoch) this.pendingConnect = false;
      }
    })();
  }

  /**
   * 设置 WebSocket 事件监听
   */
  private setupEventListeners(): void {
    if (!this.ws) return;

    const socket = this.ws;
    this.ws.onopen = () => {
      if (this.ws !== socket) return;
      logger.log("[WebSocket] 连接成功");
      this._isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = WEBSOCKET_RECONNECT_DELAY;
      this.startHeartbeat();
      this.emit("connected", null);
    };

    this.ws.onclose = (event) => {
      if (this.ws !== socket) return;
      logger.log("[WebSocket] 连接关闭:", event.code, event.reason);
      this._isConnected = false;
      this.stopHeartbeat();
      this.cancelPending({ transportUnknown: true, message: "连接已断开" });
      this.emit("disconnected", { code: event.code, reason: event.reason });

      if (!this.isManualClose) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      if (this.ws !== socket) return;
      logger.error("[WebSocket] 连接错误:", error);
      this.emit("error", { message: "连接发生错误" });
    };

    this.ws.onmessage = (event) => {
      if (this.ws !== socket) return;

      this.handleMessage(event.data);
    };
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as WSMessage & {
        action?: string;
        data?: DirectMessage & {
          businessCode?: string;
          message?: string;
          details?: Record<string, unknown>;
        };
      };
      const key = message.data?.clientMessageId;
      const pending = key ? this.pendingDirect.get(key) : undefined;
      if (
        pending &&
        message.data?.roomId === pending.room &&
        (message.action === "ack" || message.type === "error")
      ) {
        clearTimeout(pending.timer);
        this.pendingDirect.delete(key!);
        if (message.type === "error")
          pending.reject({
            businessCode: message.data.businessCode,
            message: message.data.message,
            details: message.data.details,
          });
        else pending.resolve(message.data);
      }

      // 心跳响应，静默处理
      if (message.type === "pong") {
        return;
      }

      // 触发对应类型的事件
      this.emit(message.type, message);

      // 只对 type === 'message' 的消息触发通用消息事件
      // 其他类型的消息（如 mute, user_status 等）只触发特定事件
      if (message.type === "message") {
        this.emit("new_message", message);
      }
    } catch (error) {
      logger.error(
        "[WebSocket] 消息解析失败:",
        error instanceof Error ? error.name : "invalid message",
      );
    }
  }

  /**
   * 发送消息
   */
  send(message: WSSendMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn("[WebSocket] 连接未就绪，无法发送消息");
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error("[WebSocket] 发送消息失败:", error);
      return false;
    }
  }

  /**
   * 发送聊天消息
   */
  public sendChatMessage(
    roomId: string,
    text: string,
    messageType: "text" | "image" | "file" = "text",
    replyTo?: string,
  ): boolean {
    const message: WSSendMessage = {
      type: "message",
      action: "send", // 根据文档，必须包含 action 字段
      data: {
        roomId,
        messageType,
        text,
        ...(replyTo && { quotedMessageId: replyTo }), // 使用 quotedMessageId 而不是 replyTo
      },
    };

    const result = this.send(message);
    logger.log("[WebSocketClient] 消息发送结果:", result);
    return result;
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: "ping" });
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
      logger.log("[WebSocket] 达到最大重连次数，停止重连");
      this.emit("reconnect_failed", null);
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000);

    logger.log(
      `[WebSocket] ${delay / 1000}秒后尝试第 ${this.reconnectAttempts} 次重连...`,
    );

    this.emit("reconnecting", { attempt: this.reconnectAttempts, delay });

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.connectionEpoch++;
    this.pendingConnect = false;
    this.cancelPending({ businessCode: "USER_LOGOUT", message: "会话已结束" });
    logger.log("[WebSocket] 主动断开连接");
    this.isManualClose = true;
    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
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
    // 只在首次注册时打印日志
    if (this.eventHandlers.get(event)!.size === 1) {
      logger.log("[WebSocket] 注册事件处理器:", event);
    }
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
    if (event !== "pong" && event !== "ping") {
      logger.log(
        "[WebSocket] emit 事件:",
        event,
        "处理器数量:",
        handlers?.size || 0,
      );
    }
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          if (event !== "pong" && event !== "ping") {
            logger.log("[WebSocket] 执行事件处理器:", event);
          }
          handler(data);
        } catch (error) {
          logger.error(`[WebSocket] 事件处理器错误 [${event}]:`, error);
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
