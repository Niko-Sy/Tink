import type { PublicUserProfile } from "./social";
export interface DirectMessage {
  messageId: string;
  roomId: string;
  conversationKind: "direct";
  clientMessageId: string;
  directSeq: string;
  revision: string;
  userId: string;
  sender: PublicUserProfile;
  type: "text";
  text: string;
  time: string;
  quotedMessageId: string | null;
  quote: {
    messageId: string;
    sender: PublicUserProfile;
    text: string;
    isDeleted: boolean;
  } | null;
  editedAt: string | null;
  deletedAt: string | null;
  isDeleted: boolean;
}
export interface DirectConversation {
  roomId: string;
  conversationKind: "direct";
  peer: PublicUserProfile;
  createdAt: string;
  lastActivityAt: string;
  lastMessage: DirectMessage | null;
  unreadCount: number;
  lastReadSeq: string;
  latestSeq: string;
  changeRevision: string;
  canSend: boolean;
  readOnlyReason:
    | "feature_disabled"
    | "peer_unavailable"
    | "not_friends"
    | "globally_muted"
    | null;
}
export interface DirectSendInput {
  type: "text";
  text: string;
  clientMessageId: string;
  quotedMessageId?: string;
}
export interface DirectHistory {
  messages: DirectMessage[];
  hasMore: boolean;
  nextCursor: string;
  latestSeq: string;
  changeRevision: string;
}
export interface DirectChanges {
  changes: {
    revision: string;
    action: "new" | "edited" | "deleted";
    message: DirectMessage;
  }[];
  hasMore: boolean;
  nextCursor: string;
  upToRevision: string;
}
export interface DirectList {
  list: DirectConversation[];
  hasMore: boolean;
  nextCursor: string;
}
export interface DirectRead {
  roomId: string;
  lastReadSeq: string;
  unreadCount: number;
}
export interface PendingDirect {
  input: DirectSendInput;
  state: "sending" | "failed";
  error?: string;
}
