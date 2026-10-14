import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { SocialContext } from "./social";
import type { SocialState } from "./social";
import { friendService } from "../services/friend";
import { wsClient } from "../services/websocket";
import { socialError } from "../hooks/useSocial";
import type {
  FriendContact,
  SocialCapabilities,
  SocialSummary,
} from "../types/social";
import { DirectProvider } from "./DirectProvider";
import { InvitationProvider } from "./InvitationProvider";
import AddFriendModal from "../components/social/AddFriendModal";
const emptySummary: SocialSummary = {
  receivedPendingFriendRequests: 0,
  receivedPendingInvitations: 0,
  directUnreadMessages: 0,
};
const signedOut: SocialState = {
  revision: 0,
  capabilities: null,
  summary: emptySummary,
  preview: [],
  totalFriends: 0,
  loading: false,
  error: null,
  addTarget: undefined,
  refresh: () => {},
  openAddFriend: () => {},
  closeAddFriend: () => {},
};
export function SocialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? (
    <AuthenticatedSocial key={user.userId} userId={user.userId}>
      {children}
    </AuthenticatedSocial>
  ) : (
    <SocialContext.Provider value={signedOut}>
      {children}
    </SocialContext.Provider>
  );
}
function AuthenticatedSocial({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string;
}) {
  const [revision, setRevision] = useState(0);
  const [capabilities, setCapabilities] = useState<SocialCapabilities | null>(
    null,
  );
  const [summary, setSummary] = useState(emptySummary);
  const [preview, setPreview] = useState<FriendContact[]>([]);
  const [totalFriends, setTotalFriends] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addTarget, setAddTarget] = useState<string | null | undefined>(
    undefined,
  );
  const refresh = useCallback(() => setRevision((v) => v + 1), []);
  const openAddFriend = useCallback(
    (id?: string) => setAddTarget(id ?? null),
    [],
  );
  const closeAddFriend = useCallback(() => setAddTarget(undefined), []);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const caps = await friendService.capabilities();
        if (!alive) return;
        setCapabilities(caps.data);
        if (caps.data.friends) {
          const [count, contacts] = await Promise.all([
            friendService.summary(),
            friendService.friends({
              q: "",
              status: "all",
              page: 1,
              pageSize: 20,
            }),
          ]);
          if (!alive) return;
          setSummary(count.data);
          setPreview(contacts.data.list);
          setTotalFriends(contacts.data.total);
        } else {
          setSummary(
            caps.data.directMessages || caps.data.roomInvitations
              ? (await friendService.summary()).data
              : emptySummary,
          );
          setPreview([]);
          setTotalFriends(0);
        }
        setError(null);
      } catch (err) {
        if (alive) setError(socialError(err));
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [userId, revision]);
  useEffect(() => {
    const events = [
      "friend_request",
      "friendship",
      "friend_presence",
      "invitation",
      "room_invitations",
      "connected",
    ];
    for (const event of events) wsClient.on(event, refresh);
    const visible = () => {
      if (!document.hidden) refresh();
    };
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    const timer = window.setInterval(() => {
      if (!document.hidden && !wsClient.isConnected) refresh();
    }, 30000);
    return () => {
      for (const event of events) wsClient.off(event, refresh);
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
      window.clearInterval(timer);
    };
  }, [refresh]);
  const value = useMemo(
    () => ({
      revision,
      capabilities,
      summary,
      preview,
      totalFriends,
      loading,
      error,
      addTarget,
      refresh,
      openAddFriend,
      closeAddFriend,
    }),
    [
      revision,
      capabilities,
      summary,
      preview,
      totalFriends,
      loading,
      error,
      addTarget,
      refresh,
      openAddFriend,
      closeAddFriend,
    ],
  );
  return (
    <SocialContext.Provider value={value}>
      <InvitationProvider>
        <DirectProvider>{children}</DirectProvider>
      </InvitationProvider>
      {addTarget !== undefined && (
        <AddFriendModal key={addTarget ?? "search"} targetId={addTarget} />
      )}
    </SocialContext.Provider>
  );
}
