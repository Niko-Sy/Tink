import { apiRequest } from "./api";
import type { PaginatedResponse } from "./api";
import type {
  RoomCandidate,
  InviteCandidate,
  RoomInvitation,
  InvitationResult,
} from "../types/invitation";
export const invitationService = {
  rooms: (q: string, page: number, inviteeId?: string) =>
    apiRequest.get<PaginatedResponse<RoomCandidate>>(
      "/users/me/invitable-chatrooms",
      { q, page, pageSize: 20, inviteeId },
    ),
  candidates: (roomId: string, q: string, page: number) =>
    apiRequest.get<PaginatedResponse<InviteCandidate>>(
      `/chatroom/${roomId}/invite-candidates`,
      { q, page, pageSize: 20 },
    ),
  create: (roomId: string, inviteeId: string, message: string) =>
    apiRequest.post<InvitationResult>(`/chatroom/${roomId}/invitations`, {
      inviteeId,
      message,
    }),
  list: (direction: string, status: string, page: number, roomId?: string) =>
    apiRequest.get<PaginatedResponse<RoomInvitation>>(
      roomId
        ? `/chatroom/${roomId}/invitations`
        : "/users/me/chatroom-invitations",
      { direction, status, page, pageSize: 20 },
    ),
  handle: (id: string, action: "accept" | "reject" | "cancel") =>
    apiRequest.post<InvitationResult>(
      `/chatroom-invitations/${id}/${action}`,
      {},
    ),
};
export const invitationReasons: Record<string, string> = {
  SELF: "不能邀请自己",
  ACCOUNT_UNAVAILABLE: "账号不可用",
  NOT_FRIENDS: "请先添加好友",
  ALREADY_MEMBER: "已加入",
  INVITATION_ALREADY_PENDING: "已有待处理邀请",
  REQUEST_COOLDOWN: "冷却中，请稍后重试",
};

export const invitationStatuses = {
  pending: "待处理",
  accepted: "已接受",
  rejected: "已拒绝",
  cancelled: "已取消",
  expired: "已过期",
  invalidated: "已失效",
};

export const invitationRoomTypes = {
  public: "公开群",
  private: "邀请制群",
  protected: "密码群",
  unavailable: "不可用",
};
