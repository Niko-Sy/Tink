import { createContext } from 'react';
import type { DirectConversation, DirectMessage, DirectSendInput, PendingDirect } from '../types/direct';
export interface DirectState {
  items: DirectConversation[]; loading: boolean; error: string | null; hasMore: boolean; revision: number;
  messages: Record<string, DirectMessage[]>; pending: Record<string, PendingDirect[]>; drafts: Record<string, string>;
  refresh: () => void; loadMore: () => Promise<void>; start: (peerUserId: string) => Promise<void>;
  merge: (room: string, messages: DirectMessage[]) => void; send: (room: string, input: DirectSendInput) => Promise<void>;
  setDraft: (room: string, text: string) => void; getCursor: (room: string) => string | undefined;
  setCursor: (room: string, cursor: string) => void;
}
export const DirectContext = createContext<DirectState | null>(null);
