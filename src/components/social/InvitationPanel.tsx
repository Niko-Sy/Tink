import { invitationRoomTypes } from "../../services/invitation";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Empty, Pagination, Spin } from "antd";
import { invitationStatuses } from "../../services/invitation";
import { invitationService } from "../../services/invitation";
import { useInvitations } from "../../hooks/useInvitations";
import { useSocial, socialError } from "../../hooks/useSocial";
import { wsClient } from "../../services/websocket";
import type { RoomInvitation } from "../../types/invitation";
import type { PaginatedResponse } from "../../services/api";
import ProfileSummary from "./ProfileSummary";
export default function InvitationPanel({
  direction,
  status,
  page,
  onPage,
  roomId,
}: {
  direction: string;
  status: string;
  page: number;
  onPage: (p: number) => void;
  roomId?: string;
}) {
  const inv = useInvitations();
  const social = useSocial();
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<RoomInvitation>>({
    list: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const pending = useRef(new Set<string>());
  const generation = useRef(0);
  const mounted = useRef(false);
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [localPage, setLocalPage] = useState(1);
  const currentPage = roomId ? localPage : page;
  const refresh = inv.refresh;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const gen = ++generation.current;
    let alive = true;
    setLoading(true);
    void invitationService
      .list(direction, status, currentPage, roomId)
      .then((v) => {
        if (alive && gen === generation.current) {
          setData(v.data);
          setError(null);
        }
      })
      .catch((e) => {
        if (alive) setError(socialError(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [direction, status, currentPage, roomId, inv.revision]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden && !wsClient.isConnected) refresh();
    }, 30000);
    return () => {
      clearInterval(timer);
    };
  }, [refresh]);
  const handle = async (
    i: RoomInvitation,
    action: "accept" | "reject" | "cancel",
  ) => {
    if (pending.current.has(i.invitationId)) return;
    const queryGeneration = generation.current;
    pending.current.add(i.invitationId);
    setBusy(new Set(pending.current));
    try {
      const v = await invitationService.handle(i.invitationId, action);
      if (!mounted.current) return;
      if (queryGeneration === generation.current)
        setData((old) => ({
          ...old,
          list: old.list.map((x) =>
            x.invitationId === i.invitationId ? v.data.invitation : x,
          ),
        }));
      setError(null);
      social.refresh();
      inv.refresh();
      if (v.data.chatroom) {
        setJoinedRoom(v.data.chatroom.roomId);
        window.dispatchEvent(new Event("chatrooms:refresh"));
      }
    } catch (e) {
      if (mounted.current) setError(socialError(e));
      inv.refresh();
    } finally {
      pending.current.delete(i.invitationId);
      if (mounted.current) setBusy(new Set(pending.current));
    }
  };
  return (
    <section aria-label="群邀请" className="space-y-4">
      {joinedRoom && (
        <Alert
          type="success"
          message="已加入聊天室"
          action={
            <Button
              onClick={() => {
                inv.closeManagement();
                navigate(`/rooms/${joinedRoom}`);
              }}
            >
              进入聊天室
            </Button>
          }
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          action={<Button onClick={inv.refresh}>重试</Button>}
        />
      )}{" "}
      {loading && <Spin />}
      {!loading && !error && !data.list.length && (
        <Empty description="暂无群邀请" />
      )}
      {data.list.map((i) => (
        <article
          key={i.invitationId}
          data-testid={`invitation-${i.invitationId}`}
          className="p-5 rounded-xl bg-gray-800/60"
        >
          <h3 className="text-lg">
            {i.room.name} · {invitationRoomTypes[i.room.type]}
          </h3>
          <ProfileSummary
            profile={direction === "received" ? i.inviter : i.invitee}
          />
          <p className="my-3">{i.message || "未填写留言"}</p>
          <p>
            {invitationStatuses[i.status]} · 有效至{" "}
            {new Date(i.expiresAt).toLocaleString()}
          </p>
          {i.status === "invalidated" && <p>好友、成员或房间授权已变化</p>}
          <div className="flex gap-3 mt-4">
            {i.canAccept && (
              <Button
                type="primary"
                disabled={busy.has(i.invitationId)}
                onClick={() => void handle(i, "accept")}
              >
                接受邀请
              </Button>
            )}
            {i.canReject && (
              <Button
                disabled={busy.has(i.invitationId)}
                onClick={() => void handle(i, "reject")}
              >
                拒绝邀请
              </Button>
            )}
            {i.canCancel && (
              <Button
                disabled={busy.has(i.invitationId)}
                onClick={() => void handle(i, "cancel")}
              >
                取消邀请
              </Button>
            )}
            {i.status === "accepted" && i.canEnter && (
              <Button onClick={() => navigate(`/rooms/${i.roomId}`)}>
                进入聊天室
              </Button>
            )}
          </div>
        </article>
      ))}
      {data.total > 20 && (
        <Pagination
          current={currentPage}
          pageSize={20}
          total={data.total}
          onChange={roomId ? setLocalPage : onPage}
          showSizeChanger={false}
        />
      )}
    </section>
  );
}
