import { createContext } from "react";
import type { InviteOptions } from "../types/invitation";
export interface InvitationState {
  revision: number;
  options: InviteOptions | null;
  managementRoom: string | null;
  openInvite: (options?: InviteOptions) => void;
  closeInvite: () => void;
  openManagement: (roomId: string) => void;
  closeManagement: () => void;
  refresh: () => void;
}
export const InvitationContext = createContext<InvitationState>({
  revision: 0,
  options: null,
  managementRoom: null,
  openInvite: () => {},
  closeInvite: () => {},
  openManagement: () => {},
  closeManagement: () => {},
  refresh: () => {},
});
