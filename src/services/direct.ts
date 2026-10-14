import { apiRequest } from "./api";
import type {
  DirectChanges,
  DirectConversation,
  DirectHistory,
  DirectList,
  DirectMessage,
  DirectRead,
  DirectSendInput,
} from "../types/direct";
export const directService = {
  create: (peerUserId: string) =>
    apiRequest.post<{ conversation: DirectConversation; created: boolean }>(
      "/direct-conversations",
      { peerUserId },
    ),
  list: (cursor = "") =>
    apiRequest.get<DirectList>("/users/me/direct-conversations", {
      cursor,
      pageSize: 20,
    }),
  detail: (room: string) =>
    apiRequest.get<DirectConversation>(`/direct-conversations/${room}`),
  history: (room: string, beforeSeq?: string) =>
    apiRequest.get<DirectHistory>(`/direct-conversations/${room}/messages`, {
      ...(beforeSeq ? { beforeSeq } : {}),
      pageSize: 50,
    }),
  changes: (room: string, afterRevision: string) =>
    apiRequest.get<DirectChanges>(`/direct-conversations/${room}/changes`, {
      afterRevision,
      pageSize: 50,
    }),
  send: (room: string, input: DirectSendInput) =>
    apiRequest.post<DirectMessage>(
      `/direct-conversations/${room}/messages`,
      input,
    ),
  edit: (
    room: string,
    messageId: string,
    text: string,
    expectedRevision: string,
  ) =>
    apiRequest.post<DirectMessage>(
      `/direct-conversations/${room}/messages/${messageId}/edit`,
      { text, expectedRevision },
    ),
  withdraw: (room: string, messageId: string) =>
    apiRequest.post<DirectMessage>(
      `/direct-conversations/${room}/messages/${messageId}/delete`,
      {},
    ),
  read: (room: string, lastReadMessageId: string) =>
    apiRequest.post<DirectRead>(`/direct-conversations/${room}/read`, {
      lastReadMessageId,
    }),
};
export function mergeDirectMessages(
  current: DirectMessage[],
  incoming: DirectMessage[],
): DirectMessage[] {
  const items = new Map(current.map((m) => [m.messageId, m]));
  for (const message of incoming) {
    const old = items.get(message.messageId);
    if (!old || BigInt(message.revision) >= BigInt(old.revision))
      items.set(message.messageId, message);
  }
  return [...items.values()].sort((a, b) =>
    BigInt(a.directSeq) < BigInt(b.directSeq)
      ? -1
      : BigInt(a.directSeq) > BigInt(b.directSeq)
        ? 1
        : 0,
  );
}
export function directUUID(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
