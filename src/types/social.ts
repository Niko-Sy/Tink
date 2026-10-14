export type OnlineStatus = "online" | "away" | "busy" | "offline";
export interface PublicUserProfile {
  userId: string;
  username?: string;
  nickname: string;
  avatar: string;
  signature: string;
  onlineStatus: OnlineStatus | null;
  availability: "active" | "unavailable";
}
export interface FriendContact {
  profile: PublicUserProfile;
  friendSince: string;
  relationship: "friends";
  canMessage: boolean;
}
export type RelationshipState =
  | "self"
  | "none"
  | "outgoing_pending"
  | "incoming_pending"
  | "friends"
  | "unavailable";
export interface Relationship {
  state: RelationshipState;
  pendingRequestId: string | null;
  canRequest: boolean;
  canMessage: boolean;
}
export interface FriendRequest {
  requestId: string;
  senderId: string;
  receiverId: string;
  message: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: string;
  handledAt: string | null;
  peer: PublicUserProfile;
  direction: "sent" | "received";
  canAccept: boolean;
  canReject: boolean;
  canCancel: boolean;
}
export interface RequestResult {
  request: FriendRequest;
  relationship: Relationship;
  created: boolean;
}
export interface SocialCapabilities {
  friends: boolean;
  directMessages: boolean;
  roomInvitations: boolean;
}
export interface SocialSummary {
  receivedPendingFriendRequests: number;
  receivedPendingInvitations: number;
  directUnreadMessages: number;
}
export interface UserSearchResult {
  profile: PublicUserProfile;
  relationship: Relationship;
}
