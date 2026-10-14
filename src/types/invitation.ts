import type { PublicUserProfile } from "./social";
export interface InvitationRoom {
  roomId: string;
  name: string;
  description: string;
  icon: string;
  type: "public" | "private" | "protected" | "unavailable";
  peopleCount: number;
  onlineCount: number;
  createdTime: string;
  lastMessageTime: string;
}
export interface RoomCandidate extends InvitationRoom {
  eligible: boolean;
  reason: string;
}
export interface InviteCandidate {
  profile: PublicUserProfile;
  eligible: boolean;
  reason: string;
}
export type InvitationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "expired"
  | "invalidated";
export interface RoomInvitation {
  invitationId: string;
  roomId: string;
  direction: "received" | "sent";
  status: InvitationStatus;
  inviter: PublicUserProfile;
  invitee: PublicUserProfile;
  room: InvitationRoom;
  message: string;
  createdAt: string;
  expiresAt: string;
  handledAt: string | null;
  invalidationReason: string | null;
  canEnter: boolean;
  canAccept: boolean;
  canReject: boolean;
  canCancel: boolean;
}
export interface InvitationResult {
  invitation: RoomInvitation;
  created: boolean;
  chatroom?: InvitationRoom;
  memberInfo?: unknown;
  alreadyMember?: boolean;
}
export interface InviteOptions {
  roomId?: string;
  inviteeId?: string;
  excludeRoomId?: string;
}
