import { createContext } from 'react';
import type { FriendContact, SocialCapabilities, SocialSummary } from '../types/social';
export interface SocialState {
  revision: number; capabilities: SocialCapabilities | null;
  summary: SocialSummary; preview: FriendContact[]; totalFriends: number;
  loading: boolean; error: string | null; addTarget: string | null | undefined;
  refresh: () => void; openAddFriend: (userId?: string) => void; closeAddFriend: () => void;
}
export const SocialContext = createContext<SocialState | null>(null);
