import { useState } from "react";
import { Alert, Button, Empty, Pagination, Select, Spin, Tabs } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFriendRequests } from "../hooks/useFriends";
import { socialError, useSocial } from "../hooks/useSocial";
import { friendService } from "../services/friend";
import { invitationStatuses } from "../services/invitation";
import InvitationPanel from "../components/social/InvitationPanel";
import ProfileSummary from "../components/social/ProfileSummary";
const states = {
  pending: "待处理",
  accepted: "已接受",
  rejected: "已拒绝",
  cancelled: "已取消",
};
function FriendRequestList({
  direction,
  status,
  page,
  onChange,
}: {
  direction: "received" | "sent";
  status: string;
  page: number;
  onChange: (fields: Record<string, string>) => void;
}) {
  const social = useSocial();
  const navigate = useNavigate();

  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const { data, loading, error, apply } = useFriendRequests(
    direction,
    status,
    page,
  );
  const handle = async (id: string, action: "accept" | "reject" | "cancel") => {
    if (busy.has(id)) return;
    setBusy((v) => new Set(v).add(id));
    setActionError(null);
    try {
      const result = await friendService.handle(id, action);
      apply(result.data.request);
      social.refresh();
    } catch (err) {
      setActionError(socialError(err));
      social.refresh();
    } finally {
      setBusy((v) => {
        const next = new Set(v);
        next.delete(id);
        return next;
      });
    }
  };
  if (!social.capabilities)
    return (
      <div className="p-8">
        {social.error ? (
          <Alert
            type="error"
            message={social.error}
            action={<Button onClick={social.refresh}>重试</Button>}
          />
        ) : (
          <Spin />
        )}
      </div>
    );
  if (!social.capabilities.friends)
    return (
      <div className="p-8">
        <Alert message="好友功能暂未启用" />
      </div>
    );
  return (
    <section
      className="flex-1 overflow-auto p-6 md:p-10 text-white"
      aria-label="好友申请"
    >
      <div className="flex justify-between mb-5">
        <h1 className="text-2xl">好友申请</h1>
        <Button onClick={() => navigate("/contacts")}>返回通讯录</Button>
      </div>
      <Tabs
        activeKey={direction}
        onChange={(key) => {
          onChange({ direction: key, page: "1" });
        }}
        items={[
          { key: "received", label: "收到的申请" },
          { key: "sent", label: "发出的申请" },
        ]}
      />
      <Select
        aria-label="申请状态"
        value={status}
        onChange={(v) => {
          onChange({ status: v, page: "1" });
        }}
        className="mb-6"
        style={{ width: 140 }}
        options={[
          { value: "", label: "全部申请" },
          ...Object.entries(states).map(([value, label]) => ({ value, label })),
        ]}
      />
      {(error || actionError) && (
        <Alert
          type="error"
          className="mb-4"
          message={actionError || error}
          action={<Button onClick={social.refresh}>重试</Button>}
        />
      )}
      {loading && <Spin />}
      {!loading && !error && !data.list.length && (
        <Empty description="暂无申请" />
      )}
      <div className="space-y-4">
        {data.list.map((request) => (
          <article
            key={request.requestId}
            className="rounded-xl bg-gray-800/60 p-5"
            data-testid={`request-${request.requestId}`}
          >
            <ProfileSummary profile={request.peer} />
            <p className="my-3 text-gray-300">
              {request.message || "未填写留言"}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(request.createdAt).toLocaleString()} ·{" "}
              {states[request.status]}
            </p>
            <div className="flex gap-3 mt-4">
              {request.direction === "received" &&
                request.status === "pending" && (
                  <>
                    <Button
                      type="primary"
                      disabled={
                        !request.canAccept || busy.has(request.requestId)
                      }
                      onClick={() => void handle(request.requestId, "accept")}
                    >
                      接受
                    </Button>
                    <Button
                      disabled={
                        !request.canReject || busy.has(request.requestId)
                      }
                      onClick={() => void handle(request.requestId, "reject")}
                    >
                      拒绝
                    </Button>
                  </>
                )}
              {request.canCancel && (
                <Button
                  disabled={busy.has(request.requestId)}
                  onClick={() => void handle(request.requestId, "cancel")}
                >
                  取消申请
                </Button>
              )}
              <Button onClick={() => navigate(`/user/${request.peer.userId}`)}>
                查看资料
              </Button>
            </div>
          </article>
        ))}
      </div>
      {data.total > 20 && (
        <Pagination
          className="mt-6"
          current={page}
          total={data.total}
          pageSize={20}
          showSizeChanger={false}
          onChange={(p) => onChange({ page: String(p) })}
        />
      )}
    </section>
  );
}

export default function RequestCenter() {
  const social = useSocial();
  const [params, setParams] = useSearchParams();
  const kind = params.get("kind") === "invitations" ? "invitations" : "friends";
  const direction = params.get("direction") === "sent" ? "sent" : "received";
  const allowed = kind === "invitations" ? invitationStatuses : states;
  const raw = params.get("status") ?? "pending";
  const status = raw === "" || Object.hasOwn(allowed, raw) ? raw : "pending";
  const rawPage = Number(params.get("page") ?? 1);
  const page =
    Number.isInteger(rawPage) && rawPage > 0 && rawPage <= 1000000
      ? rawPage
      : 1;
  const change = (fields: Record<string, string>) => {
    setParams((old) => {
      const next = new URLSearchParams(old);
      for (const [key, value] of Object.entries(fields)) next.set(key, value);
      return next;
    });
  };
  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 text-white">
      <h1 className="text-2xl mb-4">申请中心</h1>
      <Tabs
        activeKey={kind}
        onChange={(v) => change({ kind: v, page: "1", status: "pending" })}
        items={[
          {
            key: "friends",
            label: `好友申请 (${social.summary.receivedPendingFriendRequests})`,
          },
          {
            key: "invitations",
            label: `群邀请${social.capabilities?.roomInvitations ? ` (${social.summary.receivedPendingInvitations})` : ""}`,
          },
        ]}
      />
      {kind === "friends" ? (
        <FriendRequestList
          direction={direction}
          status={status}
          page={page}
          onChange={change}
        />
      ) : (
        <>
          <Tabs
            activeKey={direction}
            onChange={(v) => change({ direction: v, page: "1" })}
            items={[
              { key: "received", label: "收到的邀请" },
              { key: "sent", label: "发出的邀请" },
            ]}
          />
          <Select
            aria-label="邀请状态"
            className="mb-5"
            value={status}
            onChange={(v) => change({ status: v, page: "1" })}
            options={[
              { value: "", label: "全部邀请" },
              ...Object.entries(invitationStatuses).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
          {!social.capabilities?.roomInvitations && (
            <Alert message="邀请功能暂未启用，可以查看历史、拒绝或取消已有邀请" />
          )}
          <InvitationPanel
            direction={direction}
            status={status}
            page={page}
            onPage={(v) => change({ page: String(v) })}
          />
        </>
      )}
    </div>
  );
}
