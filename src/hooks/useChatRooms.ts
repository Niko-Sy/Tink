/**
 * 聊天室管理 Hook
 * 负责聊天室列表的获取、创建、加入、更新和删除
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { wsClient } from "../services/websocket";
import type { ChatRoom, ChatRoomMember, User } from "../types";
import type { ChatRoomSettings } from "../components/ChatRoomSettingsModal";
import {
  chatroomService,
  type ChatRoomListItem,
  type ApiError,
} from "../services";

export interface UseChatRoomsReturn {
  chatRooms: ChatRoom[];
  activeChatRoom: string;
  setActiveChatRoom: (roomId: string) => void;
  isLoadingRooms: boolean;
  handleJoinRoom: (roomId: string, password: string) => Promise<void>;
  handleCreateRoom: (
    name: string,
    description: string,
    password: string,
    type: "public" | "private" | "protected",
  ) => Promise<void>;
  handleSaveSettings: (settings: ChatRoomSettings) => Promise<void>;
  handleDeleteRoom: () => Promise<void>;
  getCurrentRoomSettings: () => ChatRoomSettings;
  updateRoomUnread: (roomId: string, increment: number) => void;
  clearRoomUnread: (roomId: string) => void;
  removeRoom: (roomId: string) => void;
}

interface UseChatRoomsOptions {
  user: User | null;
  activeRoomId?: string;
  onRoomChange?: (roomId: string) => void;
  setCurrentRoomMember: (member: ChatRoomMember | null) => void;
  onSuccess?: (
    message: string,
    description: string | React.ReactNode,
    duration?: number,
  ) => void;
  onError?: (message: string, description: string, duration?: number) => void;
  onWarning?: (message: string, description: string, duration?: number) => void;
}

// 将 ChatRoomListItem 转换为 ChatRoom
const convertToChatRoom = (item: ChatRoomListItem): ChatRoom => ({
  canInvite: item.canInvite,
  roomId: item.roomId,
  name: item.name,
  description: item.description,
  icon: item.icon || "fas fa-comments",
  type: item.type,
  onlineCount: item.onlineCount,
  peopleCount: item.peopleCount,
  createdTime: item.createdTime,
  lastMessageTime: item.lastMessageTime,
  unread:
    item.unreadCount ?? (item as unknown as { unread?: number }).unread ?? 0,
});

export const useChatRooms = ({
  user,
  activeRoomId,
  onRoomChange,
  setCurrentRoomMember,
  onSuccess,
  onError,
  onWarning,
}: UseChatRoomsOptions): UseChatRoomsReturn => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([
    {
      roomId: "home",
      name: "主页",
      description: "聊天室主页",
      icon: "fas fa-home",
      type: "public",
      onlineCount: 0,
      peopleCount: 0,
      createdTime: new Date().toISOString(),
      lastMessageTime: new Date().toISOString(),
      unread: 0,
    },
  ]);

  const [selectedRoomId, setSelectedRoomId] = useState("home");
  const activeChatRoom = activeRoomId ?? selectedRoomId;
  const setActiveChatRoom = useCallback(
    (roomId: string) => {
      setSelectedRoomId(roomId);
      onRoomChange?.(roomId);
    },
    [onRoomChange],
  );
  const activeRoomRef = useRef(activeChatRoom);
  useEffect(() => {
    activeRoomRef.current = activeChatRoom;
  }, [activeChatRoom]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomRevision, setRoomRevision] = useState(0);
  const loadError = useRef(onError);
  useEffect(() => {
    loadError.current = onError;
  }, [onError]);
  const refreshRooms = useCallback(() => setRoomRevision((v) => v + 1), []);
  useEffect(() => {
    const visible = () => {
      if (!document.hidden) refreshRooms();
    };
    const privateRoom = (event: unknown) => {
      const packet = event as { action?: string; data?: { roomId?: string } };
      const id = packet.data?.roomId;
      if (packet.action === "removed" && id) {
        setChatRooms((old) => old.filter((r) => r.roomId !== id));
        if (activeRoomRef.current === id) {
          setCurrentRoomMember(null);
          setActiveChatRoom("home");
        }
      }
      refreshRooms();
    };
    wsClient.on("room", privateRoom);
    for (const e of ["room_member", "connected"]) wsClient.on(e, refreshRooms);
    window.addEventListener("chatrooms:refresh", refreshRooms);
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    return () => {
      wsClient.off("room", privateRoom);
      for (const e of ["room_member", "connected"])
        wsClient.off(e, refreshRooms);
      window.removeEventListener("chatrooms:refresh", refreshRooms);
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refreshRooms, setCurrentRoomMember, setActiveChatRoom]);

  // Refresh all server pages; each load belongs to this account/effect.
  useEffect(() => {
    let alive = true;
    if (!user?.userId) {
      setChatRooms([]);
      return;
    }
    const load = async () => {
      setIsLoadingRooms(true);
      try {
        const items: ChatRoomListItem[] = [];
        for (let page = 1; ; page++) {
          const response = await chatroomService.getMyChatRooms(page, 100);
          if (!alive) return;
          if (response.code !== 200) throw new Error(response.message);
          const raw = response.data as
            | {
                list?: ChatRoomListItem[];
                chatrooms?: ChatRoomListItem[];
                total?: number;
              }
            | ChatRoomListItem[];
          const rows = Array.isArray(raw)
            ? raw
            : (raw.list ?? raw.chatrooms ?? []);
          items.push(...rows);
          if (
            rows.length < 100 ||
            (!Array.isArray(raw) &&
              raw.total !== undefined &&
              items.length >= raw.total)
          )
            break;
        }
        if (
          alive &&
          activeRoomRef.current !== "home" &&
          !items.some((r) => r.roomId === activeRoomRef.current)
        ) {
          setCurrentRoomMember(null);
          setActiveChatRoom("home");
        }
        if (alive)
          setChatRooms([
            {
              roomId: "home",
              name: "主页",
              description: "聊天室主页",
              icon: "fas fa-home",
              type: "public",
              onlineCount: 0,
              peopleCount: 0,
              createdTime: "",
              lastMessageTime: "",
              unread: 0,
            },
            ...items.map(convertToChatRoom),
          ]);
      } catch {
        if (alive)
          loadError.current?.("加载失败", "无法更新聊天室列表，请稍后重试", 2);
      } finally {
        if (alive) setIsLoadingRooms(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [user, roomRevision, setCurrentRoomMember, setActiveChatRoom]);

  // 处理加入聊天室
  const handleJoinRoom = useCallback(
    async (roomId: string, password: string) => {
      if (!chatroomService.validateRoomId(roomId)) {
        onError?.("加入失败", "聊天室ID必须是9位数字！", 2);
        return;
      }

      if (chatRooms.some((room) => room.roomId === roomId)) {
        onWarning?.("已加入", "你已经在这个聊天室中了", 2);
        setActiveChatRoom(roomId);
        return;
      }

      try {
        const response = await chatroomService.joinRoom({
          roomId,
          password: password || undefined,
        });

        if (response.code === 200 && response.data) {
          const chatroomData = response.data.chatroom;
          const newRoom: ChatRoom = {
            roomId: chatroomData.roomId,
            canInvite:
              chatroomData.type === "public" ||
              response.data.memberInfo.roomRole === "owner" ||
              response.data.memberInfo.roomRole === "admin",
            name: chatroomData.name,
            description: chatroomData.description,
            icon: chatroomData.icon || "fas fa-comments",
            type: chatroomData.type,
            onlineCount: chatroomData.onlineCount || 0,
            peopleCount: chatroomData.peopleCount || 1,
            createdTime: chatroomData.createdTime,
            lastMessageTime:
              chatroomData.lastMessageTime || chatroomData.createdTime,
            unread: 0,
          };

          setChatRooms((prev) => [
            ...prev.filter((r) => r.roomId !== newRoom.roomId),
            newRoom,
          ]);

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

          onSuccess?.("成功加入聊天室", `已加入聊天室 ${newRoom.name}`, 2);
        } else {
          onError?.("加入失败", response.message || "无法加入聊天室", 2);
        }
      } catch (err) {
        const apiError = err as ApiError;
        onError?.("加入失败", apiError.message || "加入聊天室时发生错误", 2);
      }
    },
    [
      chatRooms,
      setCurrentRoomMember,
      onSuccess,
      onError,
      onWarning,
      setActiveChatRoom,
    ],
  );

  // 处理创建聊天室
  const handleCreateRoom = useCallback(
    async (
      name: string,
      description: string,
      password: string,
      type: "public" | "private" | "protected" = "public",
    ) => {
      try {
        const response = await chatroomService.createRoom({
          name,
          description,
          type,
          password: type === "protected" ? password : undefined,
          icon: "fas fa-comments",
        });

        if (response.code === 200 && response.data) {
          const chatroomData = response.data.chatroom;
          const newRoom: ChatRoom = {
            roomId: chatroomData.roomId,
            canInvite:
              chatroomData.type === "public" ||
              response.data.memberInfo.roomRole === "owner" ||
              response.data.memberInfo.roomRole === "admin",
            name: chatroomData.name,
            description: chatroomData.description,
            icon: chatroomData.icon || "fas fa-comments",
            type: chatroomData.type,
            onlineCount: chatroomData.onlineCount || 1,
            peopleCount: chatroomData.peopleCount || 1,
            createdTime: chatroomData.createdTime,
            lastMessageTime:
              chatroomData.lastMessageTime || chatroomData.createdTime,
            unread: 0,
          };

          setChatRooms((prev) => [
            ...prev.filter((r) => r.roomId !== newRoom.roomId),
            newRoom,
          ]);

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

          navigator.clipboard
            .writeText(newRoom.roomId)
            .then(() => {
              onSuccess?.(
                "聊天室创建成功",
                `聊天室ID: ${newRoom.roomId}\n✓ ID已复制到剪贴板，请妥善保管密码`,
                4,
              );
            })
            .catch(() => {
              onSuccess?.(
                "聊天室创建成功",
                `聊天室ID: ${newRoom.roomId}\n⚠ 请手动复制聊天室ID`,
                4,
              );
            });
        } else {
          onError?.("创建失败", response.message || "无法创建聊天室", 2);
        }
      } catch (err) {
        const apiError = err as ApiError;
        onError?.("创建失败", apiError.message || "创建聊天室时发生错误", 2);
      }
    },
    [setCurrentRoomMember, onSuccess, onError, setActiveChatRoom],
  );

  // 处理聊天室设置保存
  const handleSaveSettings = useCallback(
    async (settings: ChatRoomSettings) => {
      try {
        const response = await chatroomService.updateRoom(activeChatRoom, {
          name: settings.name,
          description: settings.description,
          type: settings.type,
          password: settings.password || undefined,
          icon: settings.icon,
        });

        if (response.code === 200) {
          setChatRooms((prev) =>
            prev.map((room) =>
              room.roomId === activeChatRoom
                ? {
                    ...room,
                    name: settings.name,
                    icon: settings.icon,
                    description: settings.description,
                    type: settings.type,
                  }
                : room,
            ),
          );

          onSuccess?.("✓ 设置保存成功", "聊天室信息已更新", 2);
        } else {
          onError?.("保存失败", response.message || "无法保存设置", 2);
        }
      } catch (err) {
        const apiError = err as ApiError;
        onError?.("保存失败", apiError.message || "保存设置时发生错误", 2);
      }
    },
    [activeChatRoom, onSuccess, onError],
  );

  // 处理解散聊天室
  const handleDeleteRoom = useCallback(async () => {
    try {
      const response = await chatroomService.deleteRoom(activeChatRoom);

      if (response.code === 200) {
        setChatRooms((prev) =>
          prev.filter((room) => room.roomId !== activeChatRoom),
        );
        setActiveChatRoom("home");
        onSuccess?.("聊天室已解散", "聊天室已成功解散", 2);
      } else {
        onError?.("解散失败", response.message || "无法解散聊天室", 2);
      }
    } catch (err) {
      const apiError = err as ApiError;
      onError?.("解散失败", apiError.message || "解散聊天室时发生错误", 2);
    }
  }, [activeChatRoom, onSuccess, onError, setActiveChatRoom]);

  // 获取当前聊天室设置
  const getCurrentRoomSettings = useCallback((): ChatRoomSettings => {
    const currentRoom = chatRooms.find(
      (room) => room.roomId === activeChatRoom,
    );
    return {
      name: currentRoom?.name || "",
      description: currentRoom?.description || "",
      icon: currentRoom?.icon || "fas fa-comments",
      type: currentRoom?.type || "public",
      password: "",
    };
  }, [chatRooms, activeChatRoom]);

  // 更新聊天室未读数
  const updateRoomUnread = useCallback((roomId: string, increment: number) => {
    setChatRooms((prev) =>
      prev.map((room) =>
        room.roomId === roomId
          ? { ...room, unread: room.unread + increment }
          : room,
      ),
    );
  }, []);

  // 清除聊天室未读数
  const clearRoomUnread = useCallback((roomId: string) => {
    setChatRooms((prev) =>
      prev.map((room) =>
        room.roomId === roomId ? { ...room, unread: 0 } : room,
      ),
    );
  }, []);

  // 移除聊天室
  const removeRoom = useCallback(
    (roomId: string) => {
      setChatRooms((prev) => prev.filter((room) => room.roomId !== roomId));
      if (activeChatRoom === roomId) {
        setActiveChatRoom("home");
      }
    },
    [activeChatRoom, setActiveChatRoom],
  );

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
