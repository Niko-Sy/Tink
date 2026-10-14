/**
 * WebSocket 事件处理 Hook
 * 负责处理 WebSocket 消息、用户状态变化和成员变动
 */

import { useEffect } from "react";
import type { User, Message } from "../types";
import {
  wsClient,
  type WSNewMessage,
  type WSUserStatus,
  type WSRoomMember,
  type WSNotification,
} from "../services";

export interface UseWebSocketEventsOptions {
  user: User | null;
  activeChatRoom: string;
  addMessageToRoom: (roomId: string, message: Message) => void;
  updateMessage: (roomId: string, messageId: string, text: string) => void;
  deleteMessage: (roomId: string, messageId: string) => void;
  updateRoomUnread: (roomId: string, increment: number) => void;
  updateUserStatus: (
    userId: string,
    status: "online" | "away" | "busy" | "offline",
  ) => void;
  updateUserMuteStatus: (
    userId: string,
    isMuted: boolean,
    muteUntil?: string | null,
  ) => void;
  updateCurrentMemberMuteStatus: (
    roomId: string,
    isMuted: boolean,
    muteUntil?: string | null,
  ) => void;
  fetchRoomMembers: (roomId: string) => Promise<void>;
  removeUser: (userId: string) => void;
  removeRoom: (roomId: string) => void;
  onWarning?: (message: string, description: string, duration?: number) => void;
  onInfo?: (message: string, description: string, duration?: number) => void;
}

export const useWebSocketEvents = ({
  user,
  activeChatRoom,
  addMessageToRoom,
  updateMessage,
  deleteMessage,
  updateRoomUnread,
  updateUserStatus,
  updateUserMuteStatus,
  updateCurrentMemberMuteStatus,
  fetchRoomMembers,
  removeUser,
  removeRoom,
  onWarning,
  onInfo,
}: UseWebSocketEventsOptions) => {
  useEffect(() => {
    if (!user) return;

    // 处理新消息
    const handleNewMessage = (wsMessage: WSNewMessage) => {
      console.log("[useWebSocketEvents] 收到 WebSocket 消息:", wsMessage);
      const { data } = wsMessage;
      if (
        (data as typeof data & { conversationKind?: string })
          .conversationKind === "direct"
      )
        return;
      const action =
        wsMessage.action === ("edit" as string)
          ? "edited"
          : wsMessage.action === ("delete" as string)
            ? "deleted"
            : wsMessage.action;

      if (action === "new") {
        console.log("[useWebSocketEvents] 处理新消息:", data);
        const newMessage: Message = {
          messageId: data.messageId,
          roomId: data.roomId,
          userId: data.userId,
          userName: data.userName || data.nickname || "未知用户",
          quotedMessageId: data.quotedMessageId || undefined, // 使用 quotedMessageId
          type: data.type || data.messageType || "text", // 可能是 type 或 messageType
          text: data.text || "",
          time: data.time || data.createdTime || new Date().toISOString(),
          isOwn: data.userId === user.userId,
        };
        addMessageToRoom(data.roomId, newMessage);

        // 如果是系统通知消息，处理禁言/解禁操作
        if (newMessage.type === "system_notification" && data.text) {
          handleSystemNotificationMessage(data);
        }

        // 如果不是当前聊天室的消息，增加未读数
        if (data.roomId !== activeChatRoom) {
          updateRoomUnread(data.roomId, 1);
        }
      } else if (action === "deleted") {
        // 根据文档，action 是 'deleted'
        console.log("[useWebSocketEvents] 处理消息删除:", data);
        deleteMessage(data.roomId, data.messageId);
      } else if (action === "edited") {
        // 根据文档，action 是 'edited'
        console.log("[useWebSocketEvents] 处理消息编辑:", data);
        updateMessage(data.roomId, data.messageId, data.text || "");
      }
    };

    // 处理用户状态变化
    const handleUserStatus = (wsMessage: WSUserStatus) => {
      const { data } = wsMessage;
      updateUserStatus(data.userId, data.onlineStatus);
    };

    // 解析系统通知消息（禁言/解禁广播）
    const handleSystemNotificationMessage = (data: {
      text?: string;
      memberId?: string;
      userId?: string;
      roomId: string;
    }) => {
      const text = data.text || "";

      // 解析禁言消息："{昵称}已被禁言X分钟" 或 "{昵称}已被永久禁言"
      const mutedMatch = text.match(
        /(.+)已被禁言(\d+)(分钟|秒)|(.+)已被永久禁言/,
      );
      if (mutedMatch) {
        // 提取用户ID（优先级：1. userId字段  2. memberId中提取）
        let targetUserId: string | undefined = data.userId;

        // 如果没有userId但有memberId，从memberId中提取
        if (!targetUserId && data.memberId) {
          // memberId格式: M_U100000003_100000004，提取U100000003
          const memberIdMatch = data.memberId.match(/M_(U\d+)_/);
          if (memberIdMatch && memberIdMatch[1]) {
            targetUserId = memberIdMatch[1];
          }
        }

        if (!targetUserId) {
          return;
        }

        // 判断是否永久禁言
        const isPermanent = text.includes("永久禁言");
        let muteUntil: string | null = null;

        if (!isPermanent && mutedMatch[2]) {
          // 计算禁言到期时间
          const duration = parseInt(mutedMatch[2]);
          const unit = mutedMatch[3]; // "分钟" 或 "秒"
          const durationMs =
            unit === "分钟" ? duration * 60 * 1000 : duration * 1000;
          muteUntil = new Date(Date.now() + durationMs).toISOString();
        }

        // 更新用户禁言状态
        updateUserMuteStatus(targetUserId, true, muteUntil);

        // 如果是当前用户被禁言，同时更新当前成员状态
        if (targetUserId === user.userId) {
          updateCurrentMemberMuteStatus(data.roomId, true, muteUntil);
        }

        return;
      }

      // 解析解禁消息："{昵称}已被解除禁言"
      const unmutedMatch = text.match(/(.+)已被解除禁言/);
      if (unmutedMatch) {
        // 提取用户ID（优先级：1. userId字段  2. memberId中提取）
        let targetUserId: string | undefined = data.userId;

        // 如果没有userId但有memberId，从memberId中提取
        if (!targetUserId && data.memberId) {
          // memberId格式: M_U100000003_100000004，提取U100000003
          const memberIdMatch = data.memberId.match(/M_(U\d+)_/);
          if (memberIdMatch && memberIdMatch[1]) {
            targetUserId = memberIdMatch[1];
          }
        }

        if (!targetUserId) {
          return;
        }

        // 更新用户禁言状态
        updateUserMuteStatus(targetUserId, false, null);

        // 如果是当前用户被解禁，同时更新当前成员状态
        if (targetUserId === user.userId) {
          updateCurrentMemberMuteStatus(data.roomId, false, null);
        }

        return;
      }
    };

    // 处理成员变动（根据API文档，action在顶层）
    const handleRoomMember = (wsMessage: WSRoomMember) => {
      const { action, data } = wsMessage;

      if (action === "joined") {
        // 有新成员加入，刷新成员列表
        if (data.roomId === activeChatRoom) {
          fetchRoomMembers(data.roomId);
        }
      } else if (action === "left") {
        // 成员离开
        if (data.userId === user.userId) {
          // 如果是自己离开
          removeRoom(data.roomId);
          onWarning?.("你已离开聊天室", "", 3);
        } else {
          // 其他成员离开
          removeUser(data.userId);
        }
      } else if (action === "kicked") {
        // 成员被踢出
        if (data.userId === user.userId) {
          // 如果是自己被踢出
          removeRoom(data.roomId);
          onWarning?.("你已被移出聊天室", data.reason || "", 3);
        } else {
          // 其他成员被踢出
          removeUser(data.userId);
        }
      }
    };

    // 处理系统通知（包括禁言通知 - 个人通知）
    const handleNotification = (wsMessage: WSNotification) => {
      const { data, action } = wsMessage;

      if (action === "muted") {
        // 当前用户被禁言
        let muteUntil = data.muteUntil || null;
        let isPermanent = false;

        // 如果没有 muteUntil 但有 duration，计算到期时间
        if (!muteUntil && data.duration !== undefined) {
          if (data.duration > 0) {
            // duration 是秒数
            muteUntil = new Date(
              Date.now() + data.duration * 1000,
            ).toISOString();
          } else if (data.duration === -1) {
            // duration 为 -1 表示永久禁言
            isPermanent = true;
            muteUntil = null;
          }
        }

        // 显示禁言通知
        const durationText = isPermanent
          ? "永久"
          : muteUntil
            ? `至 ${new Date(muteUntil).toLocaleString("zh-CN")}`
            : "永久";
        const reason = data.reason ? `\n原因: ${data.reason}` : "";
        onWarning?.("你已被禁言", `禁言时长: ${durationText}${reason}`, 5);

        // 更新当前用户在该房间的成员信息（控制输入框禁用状态）
        updateCurrentMemberMuteStatus(data.roomId, true, muteUntil);

        // 同时更新用户列表中的禁言状态（UI显示）
        updateUserMuteStatus(user.userId, true, muteUntil);
      } else if (action === "unmuted") {
        // 当前用户被解除禁言
        onInfo?.("你已被解除禁言", "你现在可以发送消息了", 3);

        // 更新当前用户在该房间的成员信息（解除输入框禁用）
        updateCurrentMemberMuteStatus(data.roomId, false, null);

        // 同时更新用户列表中的禁言状态（UI显示）
        updateUserMuteStatus(user.userId, false, null);

        // 如果是当前活动房间，重新获取成员信息确保状态同步
        if (data.roomId === activeChatRoom) {
          fetchRoomMembers(data.roomId);
        }
      }
    };

    // 处理错误消息（包括禁言错误）
    const handleError = (wsError: {
      type: "error";
      action: string;
      data: { message: string };
    }) => {
      console.error("[useWebSocketEvents] ❌ 收到错误消息:", wsError);

      // 如果是禁言错误，说明前端状态不同步
      if (wsError.action === "muted") {
        console.error("[useWebSocketEvents] 🚨 禁言状态不同步！");
        console.error(
          "[useWebSocketEvents] 服务器认为用户已被禁言，但前端状态可能不正确",
        );
        console.error("[useWebSocketEvents] 当前用户ID:", user.userId);

        // 显示警告通知
        onWarning?.("你已被禁言", "无法发送消息，请刷新页面以同步最新状态", 5);

        // 尝试重新获取当前房间的成员信息以同步状态
        if (activeChatRoom) {
          console.log(
            "[useWebSocketEvents] 尝试重新获取成员信息以同步禁言状态",
          );
          fetchRoomMembers(activeChatRoom);
        }
      }
    };

    // 注册 WebSocket 事件监听
    wsClient.on("message", handleNewMessage);
    wsClient.on("user_status", handleUserStatus);
    wsClient.on("room_member", handleRoomMember);
    wsClient.on("notification", handleNotification);
    wsClient.on("error", handleError); // 监听错误事件

    return () => {
      wsClient.off("message", handleNewMessage);
      wsClient.off("user_status", handleUserStatus);
      wsClient.off("room_member", handleRoomMember);
      wsClient.off("notification", handleNotification);
      wsClient.off("error", handleError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, activeChatRoom]); // 只依赖不会频繁变化的值
};
