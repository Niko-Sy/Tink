import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Modal, Alert } from "antd";
import { InvitationContext } from "./invitation";
import { useSocial, socialError } from "../hooks/useSocial";
import { friendService } from "../services/friend";
import { wsClient } from "../services/websocket";
import type { InviteOptions } from "../types/invitation";
import InviteFriendModal from "../components/social/InviteFriendModal";
import InvitationPanel from "../components/social/InvitationPanel";
export function InvitationProvider({ children }: { children: ReactNode }) {
  const social = useSocial();
  const [options, setOptions] = useState<InviteOptions | null>(null);
  const [managementRoom, setManagementRoom] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const refresh = useCallback(() => setRevision((v) => v + 1), []);
  const openInvite = useCallback(
    (value: InviteOptions = {}) => {
      if (!social.capabilities?.roomInvitations) {
        setError("邀请功能暂未启用");
        return;
      }
      if (value.roomId === "home") {
        setError("请选择真实聊天室");
        return;
      }
      const gen = ++generation.current;
      setError(null);
      void (async () => {
        try {
          if (value.inviteeId) {
            const result = await friendService.relationship(value.inviteeId);
            if (gen !== generation.current) return;
            if (result.data.state !== "friends") {
              social.openAddFriend(value.inviteeId);
              return;
            }
          }
          setOptions(value);
        } catch (e) {
          if (gen === generation.current) setError(socialError(e));
        }
      })();
    },
    [social],
  );
  const closeInvite = useCallback(() => {
    generation.current++;
    setOptions(null);
  }, []);
  const openManagement = useCallback((id: string) => setManagementRoom(id), []);
  const closeManagement = useCallback(() => setManagementRoom(null), []);
  useEffect(() => {
    const events = [
      "invitation",
      "room_invitations",
      "friendship",
      "room",
      "connected",
    ];
    for (const e of events) wsClient.on(e, refresh);
    const visible = () => {
      if (!document.hidden) refresh();
    };
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    return () => {
      for (const e of events) wsClient.off(e, refresh);
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);
  const value = useMemo(
    () => ({
      options,
      managementRoom,
      revision,
      openInvite,
      closeInvite,
      openManagement,
      closeManagement,
      refresh,
    }),
    [
      options,
      managementRoom,
      revision,
      openInvite,
      closeInvite,
      openManagement,
      closeManagement,
      refresh,
    ],
  );
  return (
    <InvitationContext.Provider value={value}>
      {children}
      {options && (
        <InviteFriendModal
          key={`${options.roomId ?? ""}:${options.inviteeId ?? ""}:${options.excludeRoomId ?? ""}`}
          options={options}
        />
      )}
      <Modal
        title="房间邀请管理"
        open={!!managementRoom}
        onCancel={closeManagement}
        footer={null}
        width={760}
        destroyOnHidden
      >
        {managementRoom && (
          <InvitationPanel
            roomId={managementRoom}
            direction="sent"
            status=""
            page={1}
            onPage={() => {}}
          />
        )}
      </Modal>
      <Modal
        title="邀请提示"
        open={!!error}
        onCancel={() => setError(null)}
        footer={null}
      >
        <Alert type="warning" message={error} />
      </Modal>
    </InvitationContext.Provider>
  );
}
