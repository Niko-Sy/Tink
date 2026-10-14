import { invitationRoomTypes } from "../../services/invitation";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Empty, Input, Modal, Pagination, Spin } from "antd";
import { useInvitations } from "../../hooks/useInvitations";
import { useSocial, socialError } from "../../hooks/useSocial";
import {
  invitationService,
  invitationReasons,
} from "../../services/invitation";
import type {
  InviteCandidate,
  InviteOptions,
  RoomCandidate,
} from "../../types/invitation";
import ProfileSummary from "./ProfileSummary";
export default function InviteFriendModal({
  options,
}: {
  options: InviteOptions;
}) {
  const invitations = useInvitations();
  const social = useSocial();
  const [room, setRoom] = useState(options.roomId ?? "");
  const [target, setTarget] = useState(options.inviteeId ?? "");
  const [rooms, setRooms] = useState<RoomCandidate[]>([]);
  const [candidates, setCandidates] = useState<InviteCandidate[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const generation = useRef(0);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const selectingRoom = !room;
  useEffect(() => {
    const gen = ++generation.current;
    let alive = true;
    const timer = setTimeout(() => {
      setLoading(true);
      void (async () => {
        try {
          if (selectingRoom) {
            const v = await invitationService.rooms(
              query,
              page,
              options.inviteeId,
            );
            if (alive && gen === generation.current) {
              setRooms(v.data.list);
              setTotal(v.data.total);
            }
          } else if (!options.inviteeId) {
            const v = await invitationService.candidates(room, query, page);
            if (alive && gen === generation.current) {
              setCandidates(v.data.list);
              setTotal(v.data.total);
            }
          }
          if (alive && gen === generation.current) setError(null);
        } catch (e) {
          if (alive && gen === generation.current) setError(socialError(e));
        } finally {
          if (alive && gen === generation.current) setLoading(false);
        }
      })();
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [
    room,
    selectingRoom,
    query,
    page,
    options.inviteeId,
    invitations.revision,
  ]);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const chooseRoom = (id: string) => {
    setRoom(id);
    setQuery("");
    setPage(1);
    setSuccess(false);
  };
  const send = async () => {
    if (busy || !room || !target) return;
    setBusy(true);
    setError(null);
    try {
      await invitationService.create(room, target, message);
      if (!mounted.current) return;
      setSuccess(true);
      social.refresh();
      invitations.refresh();
    } catch (e) {
      if (mounted.current) setError(socialError(e));
      invitations.refresh();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="邀请好友加入聊天室"
      open
      onCancel={() => !busy && invitations.closeInvite()}
      footer={null}
      width={640}
      destroyOnHidden
    >
      {error && (
        <Alert
          type="error"
          message={error}
          action={<Button onClick={invitations.refresh}>重试</Button>}
        />
      )}
      {success && (
        <p role="status" className="my-4 text-green-400">
          邀请已发送，对方接受后加入聊天室
        </p>
      )}
      {!options.roomId && room && (
        <Button
          onClick={() => {
            setRoom("");
            setPage(1);
            setQuery("");
            if (!options.inviteeId) setTarget("");
          }}
          disabled={busy}
        >
          重新选择聊天室
        </Button>
      )}
      <h3 className="my-4">{selectingRoom ? "选择聊天室" : "选择好友"}</h3>
      {(selectingRoom || !options.inviteeId) && (
        <Input.Search
          aria-label={selectingRoom ? "搜索可邀请聊天室" : "搜索邀请好友"}
          placeholder={
            selectingRoom ? "搜索聊天室名称或ID" : "搜索好友昵称或ID"
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      )}
      {loading && <Spin />}
      {selectingRoom ? (
        <div className="max-h-72 overflow-auto space-y-2 my-3">
          {rooms
            .filter((r) => r.roomId !== options.excludeRoomId)
            .map((r) => (
              <Button
                key={r.roomId}
                block
                disabled={!r.eligible || busy}
                onClick={() => chooseRoom(r.roomId)}
              >
                {r.name} · {invitationRoomTypes[r.type]}{" "}
                {r.reason && ` · ${invitationReasons[r.reason] ?? r.reason}`}
              </Button>
            ))}
          {!loading && !rooms.length && (
            <Empty description="没有可邀请的聊天室" />
          )}
        </div>
      ) : options.inviteeId ? (
        <p className="my-4">目标好友：{options.inviteeId}</p>
      ) : (
        <div className="max-h-72 overflow-auto space-y-2 my-3">
          {candidates.map((c) => (
            <div
              key={c.profile.userId}
              className={`p-3 rounded border ${target === c.profile.userId ? "border-blue-500" : "border-gray-700"}`}
            >
              <ProfileSummary profile={c.profile} />
              <Button
                disabled={!c.eligible || busy}
                onClick={() => {
                  setTarget(c.profile.userId);
                  setSuccess(false);
                }}
              >
                {target === c.profile.userId ? "已选择" : "选择"}
                {c.reason && ` · ${invitationReasons[c.reason] ?? c.reason}`}
              </Button>
            </div>
          ))}
          {!loading && !candidates.length && <Empty description="暂无好友" />}
        </div>
      )}
      {(selectingRoom || !options.inviteeId) && total > 20 && (
        <Pagination
          current={page}
          pageSize={20}
          total={total}
          onChange={setPage}
          showSizeChanger={false}
        />
      )}
      {!selectingRoom && (
        <>
          <Input.TextArea
            aria-label="邀请留言"
            placeholder="邀请留言（可选，最多200字）"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="my-4"
          />
          <Button
            type="primary"
            loading={busy}
            disabled={
              !target ||
              Array.from(message.trim()).length > 200 ||
              !social.capabilities?.roomInvitations
            }
            onClick={() => void send()}
          >
            发送邀请
          </Button>
        </>
      )}
    </Modal>
  );
}
